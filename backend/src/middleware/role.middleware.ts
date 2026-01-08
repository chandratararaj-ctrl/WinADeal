import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/helpers';

/**
 * Authorize user based on roles
 * Usage: authorize(['ADMIN', 'VENDOR'])
 */
export const authorize = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return errorResponse(res, 'Unauthorized', 401);
        }

        if (!allowedRoles.includes(req.user.selectedRole)) {
            return errorResponse(
                res,
                `Access denied. Required role: ${allowedRoles.join(' or ')}. Your current role: ${req.user.selectedRole}`,
                403
            );
        }

        next();
    };
};
