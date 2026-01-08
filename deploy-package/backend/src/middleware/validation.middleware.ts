import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/helpers';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().reduce((acc: any, error: any) => {
            acc[error.path] = error.msg;
            return acc;
        }, {});

        console.log('Validation Errors:', JSON.stringify(formattedErrors, null, 2));
        console.log('Request Body:', JSON.stringify(req.body, null, 2));

        return errorResponse(res, 'Validation failed', 400, formattedErrors);
    }

    next();
};
