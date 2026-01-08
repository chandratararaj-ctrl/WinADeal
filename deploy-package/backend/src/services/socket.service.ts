import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

// Extend global namespace
declare global {
    var io: Server | undefined;
}

interface AuthenticatedSocket extends Socket {
    user?: {
        userId: string;
        role: string;
    };
}

class SocketService {
    private io: Server | null = null;
    private userSockets: Map<string, string> = new Map(); // userId -> socketId

    // Initialize Socket.io
    public init(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: '*', // Allow all origins for now (adjust for production)
                methods: ['GET', 'POST'],
            },
        });

        // Set global.io for access from other services
        global.io = this.io;

        this.io.use(async (socket: AuthenticatedSocket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

                if (!token || token === 'undefined' || token === 'null') {
                    console.log('Socket Auth: No token provided');
                    return next(new Error('Authentication error: No token provided'));
                }

                const secret = process.env.JWT_SECRET || 'your-secret-key';
                try {
                    const decoded = jwt.verify(token, secret) as any;
                    socket.user = { userId: decoded.userId, role: decoded.role };
                    console.log(`Socket Auth Success: ${decoded.userId}`);
                    next();
                } catch (verifyError: any) {
                    console.error('Socket JWT Verify Error:', verifyError.message);
                    return next(new Error(`Authentication error: ${verifyError.message}`));
                }
            } catch (error: any) {
                console.error('Socket Middleware Error:', error);
                next(new Error('Authentication error: Internal error'));
            }
        });

        this.io.on('connection', (socket: AuthenticatedSocket) => {
            console.log(`User connected: ${socket.user?.userId} (${socket.id})`);

            if (socket.user?.userId) {
                this.userSockets.set(socket.user.userId, socket.id);
                socket.join(socket.user.userId); // Join a room with their UserID

                // Join delivery-specific room for delivery partners
                if (socket.user.role === 'DELIVERY') {
                    socket.join(`delivery-${socket.user.userId}`);
                    console.log(`Delivery partner ${socket.user.userId} joined delivery room`);
                }

                // If vendor, join vendor room?
                if (socket.user.role === 'VENDOR') {
                    // Could join specific shop room if we had shopId
                }
            }

            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.user?.userId}`);
                if (socket.user?.userId) {
                    this.userSockets.delete(socket.user.userId);
                }
            });
        });

        console.log('✅ Socket.IO initialized and global.io set');
    }

    // Get IO instance
    public getIO(): Server | null {
        return this.io;
    }

    // Emit event to specific user
    public emitToUser(userId: string, event: string, data: any) {
        if (this.io) {
            this.io.to(userId).emit(event, data);
        }
    }

    // Emit event to all users (broadcast)
    public broadcast(event: string, data: any) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }
}

export const socketService = new SocketService();
