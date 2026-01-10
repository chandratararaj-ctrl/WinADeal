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

        // Log the origin for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
            console.log(`[CORS] Request from origin: ${origin}`);
        }

        // In development, allow all localhost origins
        if (process.env.NODE_ENV === 'development') {
            if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
                return callback(null, true);
            }
        }

        // In production, allow specific origins and all sslip.io domains
        const allowedOrigins = [
            process.env.ADMIN_PANEL_URL || 'http://localhost:3000',
            process.env.CUSTOMER_WEB_URL || 'http://localhost:3001',
            process.env.VENDOR_PANEL_URL || 'http://localhost:5174',
            process.env.DELIVERY_PANEL_URL || 'http://localhost:5177',
            'http://localhost:5173', // Local fallback
        ];

        // Allow all sslip.io domains (Coolify generated domains)
        // OR domains in allowedOrigins list
        if (origin.includes('.sslip.io') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error(`[CORS] Blocked request from origin: ${origin}`);
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
    // Use hardcoded production URLs or fallback to env/localhost for dev
    const isProd = process.env.NODE_ENV === 'production';

    const adminUrl = isProd
        ? 'http://uoog04kg4kgks80cckk4wg04.20.193.142.10.sslip.io'
        : (process.env.ADMIN_PANEL_URL || 'http://localhost:3000');

    const customerUrl = isProd
        ? 'http://w4o4c44o0oc0g0cg8w4gs8ko.20.193.142.10.sslip.io'
        : (process.env.CUSTOMER_WEB_URL || 'http://localhost:3001');

    const vendorUrl = isProd
        ? 'http://s8sg8844wwo8ss8gs4w4k4ks.20.193.142.10.sslip.io'
        : (process.env.VENDOR_PANEL_URL || 'http://localhost:5176');

    const deliveryUrl = isProd
        ? 'http://xgk48c0wgco8wos0wwgocww0.20.193.142.10.sslip.io'
        : (process.env.DELIVERY_PANEL_URL || 'http://localhost:5177');

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WinADeal - Portal Hub</title>
        <style>
            :root {
                --primary: #6366f1;
                --surface: #ffffff;
                --bg: #f3f4f6;
                --text: #1f2937;
            }
            body {
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
                background-color: var(--bg);
                color: var(--text);
                margin: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
                padding: 2rem;
            }
            .container {
                max-width: 1000px;
                width: 100%;
                text-align: center;
            }
            h1 {
                font-size: 2.5rem;
                margin-bottom: 0.5rem;
                color: #111827;
            }
            .subtitle {
                color: #6b7280;
                margin-bottom: 3rem;
            }
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 2rem;
            }
            .card {
                background: var(--surface);
                padding: 2rem;
                border-radius: 1rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                transition: transform 0.2s, box-shadow 0.2s;
                text-decoration: none;
                color: inherit;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .card:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            .card-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
            }
            .card-title {
                font-weight: 600;
                font-size: 1.25rem;
                margin-bottom: 0.5rem;
            }
            .card-desc {
                color: #6b7280;
                font-size: 0.95rem;
                line-height: 1.5;
            }
            .status-badge {
                display: inline-block;
                padding: 0.25rem 0.75rem;
                border-radius: 9999px;
                font-size: 0.75rem;
                font-weight: 500;
                background-color: #d1fae5;
                color: #065f46;
                margin-top: 1rem;
            }
            .footer {
                margin-top: 4rem;
                color: #9ca3af;
                font-size: 0.875rem;
            }
            .api-link {
                color: var(--primary);
                font-weight: 500;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>WinADeal Ecosystem</h1>
            <p class="subtitle">Select a portal to access the platform</p>

            <div class="grid">
                <a href="${customerUrl}" class="card" target="_blank">
                    <div class="card-icon">🛍️</div>
                    <div class="card-title">Customer App</div>
                    <div class="card-desc">Browse products, place orders, and track deliveries.</div>
                    <span class="status-badge">Public Access</span>
                </a>

                <a href="${adminUrl}" class="card" target="_blank">
                    <div class="card-icon">⚙️</div>
                    <div class="card-title">Admin Console</div>
                    <div class="card-desc">Manage users, shops, settings, and view system analytics.</div>
                    <span class="status-badge">Restricted</span>
                </a>

                <a href="${vendorUrl}" class="card" target="_blank">
                    <div class="card-icon">🏪</div>
                    <div class="card-title">Vendor Portal</div>
                    <div class="card-desc">Manage your shop, inventory, and incoming orders.</div>
                    <span class="status-badge">Restricted</span>
                </a>

                <a href="${deliveryUrl}" class="card" target="_blank">
                    <div class="card-icon">🛵</div>
                    <div class="card-title">Delivery Partner</div>
                    <div class="card-desc">Accept orders and manage delivery routes.</div>
                    <span class="status-badge">Mobile / Web</span>
                </a>
            </div>

            <div class="footer">
                <p>Backend API Status: <span style="color: #10b981;">Online</span> • v1.0.0</p>
                <p>Health Check: <a href="/health" class="api-link">/health</a></p>
            </div>
        </div>
    </body>
    </html>
    `;

    res.send(html);
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
import { seedDatabase } from './utils/seeder';

// ... (existing code)

// Create HTTP server (needed for Socket.io)
const server = http.createServer(app);

// Initialize Socket.io
socketService.init(server);

// Auto-seed database if empty
seedDatabase().catch(console.error);

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

