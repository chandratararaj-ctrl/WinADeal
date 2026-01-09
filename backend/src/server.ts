import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// CORS configuration
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // In development, allow all localhost origins
        if (process.env.NODE_ENV === 'development') {
            if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
                return callback(null, true);
            }
        }

        // In production, only allow specific origins
        const allowedOrigins = [
            process.env.ADMIN_PANEL_URL || 'http://localhost:3000',
            process.env.CUSTOMER_WEB_URL || 'http://localhost:3001',
            process.env.VENDOR_PANEL_URL || 'http://localhost:5174', // Vendor Panel
            'http://localhost:5173', // Delivery App or Local Fallback
        ];

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
    app.use((req: Request, _res: Response, next: NextFunction) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
    });
}

// ============================================
// ROUTES
// ============================================

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: '🛒 Welcome to WinADeal API',
        version: '1.0.0',
        description: 'Multi-Vendor Delivery Platform API',
        endpoints: {
            health: '/health',
            api: '/api/v1',
            auth: '/api/v1/auth',
            documentation: 'Coming soon',
        },
        timestamp: new Date().toISOString(),
    });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        message: 'WinADeal API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// API v1 routes
app.get('/api/v1', (_req: Request, res: Response) => {
    res.status(200).json({
        message: 'WinADeal API v1',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            shops: '/api/v1/shops',
            products: '/api/v1/products',
            orders: '/api/v1/orders',
            deliveries: '/api/v1/deliveries',
            admin: '/api/v1/admin',
        },
    });
});

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import shopRoutes from './routes/shop.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import orderRoutes from './routes/order.routes';
import deliveryRoutes from './routes/delivery.routes';
import addressRoutes from './routes/address.routes';
import paymentRoutes from './routes/payment.routes';
import analyticsRoutes from './routes/analytics.routes';
import reviewRoutes from './routes/review.routes';
import trackingRoutes from './routes/tracking.routes';
import documentRoutes from './routes/document.routes';
import couponRoutes from './routes/coupon.routes';

import payoutRoutes from './routes/payout.routes';
import commissionRoutes from './routes/commission.routes';
import payoutCycleRoutes from './routes/payout-cycle.routes';
import settingsRoutes from './routes/settings.routes';
import deliveryRequestRoutes from './routes/deliveryRequest.routes';
import cityRoutes from './routes/city.routes';
import cityCommissionRoutes from './routes/cityCommission.routes';
// import adminRoutes from './routes/admin.routes';

// Use routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/shops', shopRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/delivery', deliveryRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/tracking', trackingRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/payouts', payoutRoutes);
app.use('/api/v1/commissions', commissionRoutes);
app.use('/api/v1/payout-cycles', payoutCycleRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/delivery-requests', deliveryRequestRoutes);
app.use('/api/v1/cities', cityRoutes);
app.use('/api/v1/city-commissions', cityCommissionRoutes);
// app.use('/api/v1/admin', adminRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path,
    });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);

    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// ============================================
// START SERVER
// ============================================

import http from 'http';
import { socketService } from './services/socket.service';

// ... (existing code)

// Create HTTP server (needed for Socket.io)
const server = http.createServer(app);

// Initialize Socket.io
socketService.init(server);

// ============================================
// START SERVER
// ============================================

server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║        🛒 WinADeal API Server             ║
║                                           ║
║  Status: ✅ Running                       ║
║  Port: ${PORT}                           ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
║  URL: http://localhost:${PORT}            ║
║  Socket.io: ✅ Active                     ║
║                                           ║
╚═══════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

export default app;

