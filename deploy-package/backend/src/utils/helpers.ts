import { Request, Response, NextFunction } from 'express';

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Custom API Error class
 */
export class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(statusCode: number, message: string, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Success response helper
 */
export const successResponse = (
    res: Response,
    data: any,
    message: string = 'Success',
    statusCode: number = 200
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

/**
 * Error response helper
 */
export const errorResponse = (
    res: Response,
    message: string = 'Error',
    statusCode: number = 500,
    errors?: any
) => {
    return res.status(statusCode).json({
        success: false,
        message,
        ...(errors && { errors }),
    });
};

/**
 * Pagination helper
 */
export const getPagination = (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    return { skip, take: limit };
};

/**
 * Pagination response helper
 */
export const paginatedResponse = (
    res: Response,
    data: any[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Success'
) => {
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    });
};
