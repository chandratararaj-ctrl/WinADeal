import { Router } from 'express';
import {
    register,
    verifyOTP,
    login,
    requestOTP,
    loginWithOTP,
    refreshAccessToken,
    logout,
    getMe,
    resetPassword,
    switchRole, // NEW
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
    registerValidation,
    loginValidation,
    verifyOTPValidation,
    requestOTPValidation,
    refreshTokenValidation,
    resetPasswordValidation,
} from '../validators/auth.validator';
import { handleValidationErrors } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
    '/register',
    registerValidation,
    handleValidationErrors,
    register
);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP after registration
 * @access  Public
 */
router.post(
    '/verify-otp',
    verifyOTPValidation,
    handleValidationErrors,
    verifyOTP
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with phone and password
 * @access  Public
 */
router.post(
    '/login',
    loginValidation,
    handleValidationErrors,
    login
);

/**
 * @route   POST /api/v1/auth/request-otp
 * @desc    Request OTP for passwordless login
 * @access  Public
 */
router.post(
    '/request-otp',
    requestOTPValidation,
    handleValidationErrors,
    requestOTP
);

/**
 * @route   POST /api/v1/auth/login-otp
 * @desc    Login with OTP
 * @access  Public
 */
router.post(
    '/login-otp',
    verifyOTPValidation,
    handleValidationErrors,
    loginWithOTP
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
    '/refresh',
    refreshTokenValidation,
    handleValidationErrors,
    refreshAccessToken
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post(
    '/reset-password',
    resetPasswordValidation,
    handleValidationErrors,
    resetPassword
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user details
 * @access  Private
 */
router.get('/me', authenticate, getMe);

/**
 * @route   POST /api/v1/auth/switch-role
 * @desc    Switch between user roles
 * @access  Private
 */
router.post('/switch-role', authenticate, switchRole);

export default router;
