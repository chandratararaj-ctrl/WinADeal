import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { errorResponse } from '../utils/helpers';
import prisma from '../config/database';

// Request type extension is now handled in types.d.ts

/**
 * Authenticate user with JWT token
 */
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(res, 'No token provided', 401);
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        let decoded;
        try {
            decoded = verifyToken(token);
            console.log('[AUTH] Token decoded successfully:', {
                userId: decoded.userId,
                roles: decoded.roles,
                selectedRole: decoded.selectedRole
            });
        } catch (e: any) {
            console.error('Token verification failed:', e.message);
            return errorResponse(res, 'Invalid token: ' + e.message, 401);
        }

        // Check if user exists and is active
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                roles: true,  // Changed from role to roles
                isActive: true,
            },
        });

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        if (!user.isActive) {
            return errorResponse(res, 'Account is deactivated', 403);
        }

        // Validate selectedRole is in user's roles
        const selectedRole = decoded.selectedRole || user.roles[0];
        if (!user.roles.includes(selectedRole)) {
            console.error('[AUTH] Invalid role selection:', {
                selectedRole,
                userRoles: user.roles
            });
            return errorResponse(res, 'Invalid role selection', 403);
        }

        // Attach user to request with roles array and selectedRole
        req.user = {
            userId: user.id,
            roles: user.roles,
            selectedRole: selectedRole,
        };

        console.log('[AUTH] User authenticated:', {
            userId: req.user.userId,
            roles: req.user.roles,
            selectedRole: req.user.selectedRole
        });

        return next();
    } catch (error: any) {
        console.error('Authentication error:', error);
        return errorResponse(res, 'Invalid or expired token', 401);
    }
};

/**
 * Authorize user based on roles
 * Checks if the user's currently selected role is among the allowed roles
 */
export const authorize = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            console.error('[AUTH] Authorization failed: No user in request');
            return errorResponse(res, 'Unauthorized', 401);
        }

        console.log('[AUTH] Authorization check:', {
            userId: req.user.userId,
            userRoles: req.user.roles,
            selectedRole: req.user.selectedRole,
            allowedRoles: allowedRoles,
            endpoint: req.path
        });

        // Check if the user's selected role is allowed
        if (!allowedRoles.includes(req.user.selectedRole)) {
            console.error('[AUTH] Authorization denied:', {
                selectedRole: req.user.selectedRole,
                allowedRoles: allowedRoles,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your current role: ${req.user.selectedRole}`
            });
            return errorResponse(
                res,
                `Access denied. Required role: ${allowedRoles.join(' or ')}. Your current role: ${req.user.selectedRole}`,
                403
            );
        }

        console.log('[AUTH] Authorization successful for role:', req.user.selectedRole);
        return next();
    };
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    roles: true,
                    isActive: true,
                },
            });

            if (user && user.isActive) {
                const selectedRole = decoded.selectedRole || user.roles[0];
                if (user.roles.includes(selectedRole)) {
                    req.user = {
                        userId: user.id,
                        roles: user.roles,
                        selectedRole: selectedRole,
                    };
                }
            }
        }

        return next();
    } catch (error) {
        // Continue without authentication
        return next();
    }
};
