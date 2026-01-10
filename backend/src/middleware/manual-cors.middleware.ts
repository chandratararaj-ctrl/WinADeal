import { Request, Response, NextFunction } from 'express';

/**
 * Manual CORS Middleware
 * Sets CORS headers directly on the response
 * This is a fallback in case the cors() package isn't working
 */
export const manualCorsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const origin = req.get('Origin') || req.get('origin');

    // Log every CORS request for debugging
    console.log(`[Manual CORS] Method: ${req.method}, Origin: ${origin || 'No origin'}, Path: ${req.path}`);

    // Allow requests with no origin (like direct curl requests, mobile apps)
    if (!origin) {
        console.log('[Manual CORS] ✅ No origin header - allowing request');
        return next();
    }

    // Check if origin is allowed
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isSslipIo = origin.includes('.sslip.io');

    if (isLocalhost || isSslipIo) {
        // Set CORS headers for allowed origins
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Request-Id');
        res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

        console.log(`[Manual CORS] ✅ Headers set for: ${origin}`);
    } else {
        console.error(`[Manual CORS] ❌ Blocked origin: ${origin}`);
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        console.log('[Manual CORS] Handling OPTIONS preflight request');
        return res.status(204).send();
    }

    next();
};
