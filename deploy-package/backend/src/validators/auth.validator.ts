import { body } from 'express-validator';

/**
 * Validation rules for user registration
 */
export const registerValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),

    body('phone')
        .trim()
        .customSanitizer((value) => value.replace(/[\s-()]/g, ''))
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage('Invalid phone number format'),

    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),

    body('role')
        .optional()
        .isIn(['CUSTOMER', 'VENDOR', 'DELIVERY'])
        .withMessage('Invalid role. Must be CUSTOMER, VENDOR, or DELIVERY'),
];

/**
 * Validation rules for login
 */
export const loginValidation = [
    body('phone')
        .optional()
        .trim()
        .customSanitizer((value) => value.replace(/[\s-()]/g, ''))
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage('Invalid phone number format'),

    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Invalid email format'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    body().custom((_value, { req }) => {
        if (!req.body.phone && !req.body.email) {
            throw new Error('Phone number or Email is required');
        }
        return true;
    }),
];

/**
 * Validation rules for OTP verification
 */
export const verifyOTPValidation = [
    body('phone')
        .trim()
        .customSanitizer((value) => value.replace(/[\s-]/g, ''))
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^\+?[0-9]\d{9,14}$/)
        .withMessage('Invalid phone number format'),

    body('otp')
        .trim()
        .notEmpty()
        .withMessage('OTP is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits')
        .isNumeric()
        .withMessage('OTP must contain only numbers'),
];

/**
 * Validation rules for requesting OTP
 */
export const requestOTPValidation = [
    body('phone')
        .trim()
        .customSanitizer((value) => value.replace(/[\s-()]/g, ''))
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^\+?[0-9]{10,15}$/) // Allow 10-15 digits
        .withMessage('Invalid phone number format'),
];

/**
 * Validation rules for refresh token
 */
export const refreshTokenValidation = [
    body('refreshToken')
        .trim()
        .notEmpty()
        .withMessage('Refresh token is required'),
];

/**
 * Validation rules for password reset
 */
export const resetPasswordValidation = [
    body('phone')
        .trim()
        .customSanitizer((value) => value.replace(/[\s-]/g, ''))
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^\+?[0-9]\d{9,14}$/)
        .withMessage('Invalid phone number format'),

    body('otp')
        .trim()
        .notEmpty()
        .withMessage('OTP is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits'),

    body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
];
