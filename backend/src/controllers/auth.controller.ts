import { Request, Response } from 'express';
import prisma from '../config/database';
import {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    generateOTP,
    getOTPExpiry,
} from '../utils/auth';
import { successResponse, errorResponse } from '../utils/helpers';

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const register = async (req: Request, res: Response) => {
    try {
        const { name, phone, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { phone },
        });

        if (existingUser) {
            return errorResponse(res, 'User with this phone number already exists', 400);
        }

        // Check email if provided
        if (email) {
            const existingEmail = await prisma.user.findUnique({
                where: { email },
            });

            if (existingEmail) {
                return errorResponse(res, 'User with this email already exists', 400);
            }
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiresAt = getOTPExpiry();

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                phone,
                email,
                passwordHash,
                roles: [role || 'CUSTOMER'], // Store as array
                otp,
                otpExpiresAt,
                isVerified: false,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                roles: true,
                isVerified: true,
            },
        });

        // Auto-create Delivery Partner profile if role is DELIVERY
        if (role === 'DELIVERY') {
            await prisma.deliveryPartner.create({
                data: {
                    userId: user.id,
                    vehicleType: 'bike', // Default
                    city: 'Unknown',
                    isVerified: false,
                }
            });
        }

        // TODO: Send OTP via SMS (Twilio integration)
        console.log(`OTP for ${phone}: ${otp}`); // For development

        return successResponse(
            res,
            {
                userId: user.id,
                phone: user.phone,
                message: 'OTP sent successfully. Please verify your phone number.',
            },
            'Registration successful. Please verify OTP.',
            201
        );
    } catch (error: any) {
        console.error('Registration error:', error);
        return errorResponse(res, 'Registration failed', 500);
    }
};

/**
 * Verify OTP
 * POST /api/v1/auth/verify-otp
 */
export const verifyOTP = async (req: Request, res: Response) => {
    try {
        const { phone, otp } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { phone },
        });

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        // Check if already verified
        if (user.isVerified) {
            return errorResponse(res, 'User already verified', 400);
        }

        // Check OTP
        if (user.otp !== otp) {
            return errorResponse(res, 'Invalid OTP', 400);
        }

        // Check OTP expiry
        if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
            return errorResponse(res, 'OTP expired. Please request a new one.', 400);
        }

        // Update user as verified
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                otp: null,
                otpExpiresAt: null,
            },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                roles: true,
                isVerified: true,
            },
        });

        // Generate tokens with selectedRole
        const selectedRole = updatedUser.roles[0];
        const accessToken = generateAccessToken(updatedUser.id, updatedUser.roles as string[], selectedRole);
        const refreshToken = generateRefreshToken(updatedUser.id);

        return successResponse(res, {
            user: updatedUser,
            accessToken,
            refreshToken,
        }, 'OTP verified successfully');
    } catch (error: any) {
        console.error('OTP verification error:', error);
        return errorResponse(res, 'OTP verification failed', 500);
    }
};

/**
 * Login with phone and password
 * POST /api/v1/auth/login
 */
export const login = async (req: Request, res: Response) => {
    try {
        const { phone, email, password } = req.body;

        let user;

        if (phone) {
            user = await prisma.user.findUnique({ where: { phone } });
        } else if (email) {
            user = await prisma.user.findUnique({ where: { email } });
        }

        if (!user) {
            return errorResponse(res, 'Invalid credentials', 401);
        }

        // Check if user is active
        if (!user.isActive) {
            return errorResponse(res, 'Account is deactivated. Please contact support.', 403);
        }

        // Check password
        if (!user.passwordHash) {
            return errorResponse(res, 'Please use OTP login', 400);
        }

        const isPasswordValid = await comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            return errorResponse(res, 'Invalid credentials', 401);
        }

        // Generate tokens with selectedRole
        const selectedRole = user.roles[0]; // Default to first role
        const accessToken = generateAccessToken(user.id, user.roles as string[], selectedRole);
        const refreshToken = generateRefreshToken(user.id);

        // If vendor, get shop details
        let shop = null;
        if (user.roles.includes('VENDOR')) {
            shop = await prisma.shop.findUnique({
                where: { userId: user.id },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    city: true,
                    isVerified: true,
                    isOpen: true,
                    rating: true,
                }
            });
        }

        let deliveryPartner = null;
        if (user.roles.includes('DELIVERY')) {
            deliveryPartner = await prisma.deliveryPartner.findUnique({
                where: { userId: user.id },
                select: {
                    id: true,
                    isOnline: true,
                    vehicleType: true,
                    isVerified: true
                }
            });
        }

        return successResponse(res, {
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                roles: user.roles,
                selectedRole: selectedRole, // Use the same selectedRole
                isVerified: user.isVerified,
                shop: shop, // Include shop details
                deliveryPartner: deliveryPartner,
            },
            accessToken,
            refreshToken,
        }, 'Login successful');
    } catch (error: any) {
        console.error('Login error:', error);
        console.error('Error stack:', error.stack);
        console.error('Error message:', error.message);
        return errorResponse(res, 'Login failed', 500);
    }
};

/**
 * Request OTP for login (passwordless)
 * POST /api/v1/auth/request-otp
 */
export const requestOTP = async (req: Request, res: Response) => {
    try {
        const { phone } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { phone },
        });

        if (!user) {
            return errorResponse(res, 'User not found. Please register first.', 404);
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiresAt = getOTPExpiry();

        // Update user with OTP
        await prisma.user.update({
            where: { id: user.id },
            data: {
                otp,
                otpExpiresAt,
            },
        });

        // TODO: Send OTP via SMS (Twilio integration)
        console.log(`OTP for ${phone}: ${otp}`); // For development

        return successResponse(res, {
            phone,
            message: 'OTP sent successfully',
        }, 'OTP sent to your phone number');
    } catch (error: any) {
        console.error('Request OTP error:', error);
        return errorResponse(res, 'Failed to send OTP', 500);
    }
};

/**
 * Login with OTP
 * POST /api/v1/auth/login-otp
 */
export const loginWithOTP = async (req: Request, res: Response) => {
    try {
        const { phone, otp } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { phone },
        });

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        // Check OTP
        if (user.otp !== otp) {
            return errorResponse(res, 'Invalid OTP', 400);
        }

        // Check OTP expiry
        if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
            return errorResponse(res, 'OTP expired. Please request a new one.', 400);
        }

        // Clear OTP
        await prisma.user.update({
            where: { id: user.id },
            data: {
                otp: null,
                otpExpiresAt: null,
            },
        });

        // Generate tokens with selectedRole
        const selectedRole = user.roles[0];
        const accessToken = generateAccessToken(user.id, user.roles as string[], selectedRole);
        const refreshToken = generateRefreshToken(user.id);

        // If vendor, get shop details
        let shop = null;
        if (user.roles.includes('VENDOR')) {
            shop = await prisma.shop.findUnique({
                where: { userId: user.id },
                select: {
                    id: true,
                    name: true,
                    city: true,
                    isVerified: true,
                    rating: true,
                }
            });
        }

        return successResponse(res, {
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                roles: user.roles,
                selectedRole: selectedRole,
                isVerified: user.isVerified,
                shop: shop,
            },
            accessToken,
            refreshToken,
        }, 'Login successful');
    } catch (error: any) {
        console.error('OTP login error:', error);
        return errorResponse(res, 'Login failed', 500);
    }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return errorResponse(res, 'Refresh token required', 400);
        }

        // Verify refresh token
        const decoded = verifyToken(refreshToken, true);

        // Find user
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        // Generate new access token with selectedRole preserved
        const selectedRole = user.roles[0]; // Default to first role
        const accessToken = generateAccessToken(user.id, user.roles as string[], selectedRole);

        // Return new access token AND original refresh token (or new one if we wanted rotation)
        return successResponse(res, {
            accessToken,
            refreshToken: refreshToken // Return same refresh token to satisfy frontend expectations
        }, 'Token refreshed successfully');
    } catch (error: any) {
        console.error('Refresh token error:', error);
        return errorResponse(res, 'Invalid or expired refresh token', 401);
    }
};

/**
 * Logout
 * POST /api/v1/auth/logout
 */
export const logout = async (req: Request, res: Response) => {
    try {
        // In a production app, you might want to blacklist the token
        // For now, we'll just return success
        return successResponse(res, null, 'Logout successful');
    } catch (error: any) {
        console.error('Logout error:', error);
        return errorResponse(res, 'Logout failed', 500);
    }
};

/**
 * Get current user details
 * GET /api/v1/auth/me
 */
export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return errorResponse(res, 'Unauthorized', 401);
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        let shop = null;
        if (user.roles.includes('VENDOR')) {
            shop = await prisma.shop.findUnique({
                where: { userId: user.id },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    address: true,
                    city: true,
                    deliveryRadiusKm: true,
                    minOrderAmount: true,
                    openingTime: true,
                    closingTime: true,
                    isVerified: true,
                    isOpen: true,
                    rating: true,
                }
            });
        }

        let deliveryPartner = null;
        if (user.roles.includes('DELIVERY')) {
            deliveryPartner = await prisma.deliveryPartner.findUnique({
                where: { userId: user.id },
                select: {
                    id: true,
                    isOnline: true,
                    vehicleType: true,
                    isVerified: true
                }
            });
        }

        return successResponse(res, {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            roles: user.roles,
            selectedRole: req.user?.selectedRole || user.roles[0],
            isVerified: user.isVerified,
            shop,
            deliveryPartner,
        }, 'User details fetched successfully');
    } catch (error: any) {
        return errorResponse(res, 'Failed to fetch user details', 500);
    }
};

/**
 * Reset Password with OTP
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { phone, otp, newPassword } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { phone },
        });

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        // Check OTP
        if (user.otp !== otp) {
            return errorResponse(res, 'Invalid OTP', 400);
        }

        // Check OTP expiry
        if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
            return errorResponse(res, 'OTP expired. Please request a new one.', 400);
        }

        // Hash new password
        const passwordHash = await hashPassword(newPassword);

        // Update password and clear OTP
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                otp: null,
                otpExpiresAt: null,
            },
        });

        return successResponse(res, null, 'Password reset successfully. Please login with your new password.');
    } catch (error: any) {
        console.error('Reset password error:', error);
        return errorResponse(res, 'Failed to reset password', 500);
    }
};

/**
 * Switch Role
 * POST /api/v1/auth/switch-role
 */
export const switchRole = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { selectedRole } = req.body;

        if (!userId) {
            return errorResponse(res, 'Unauthorized', 401);
        }

        if (!selectedRole) {
            return errorResponse(res, 'Selected role is required', 400);
        }

        // Get user's roles
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { roles: true, name: true }
        });

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        // Validate the selected role
        if (!user.roles.includes(selectedRole)) {
            return errorResponse(
                res,
                `Invalid role. You can only switch to: ${user.roles.join(', ')}`,
                400
            );
        }

        // Generate new tokens with the selected role
        const accessToken = generateAccessToken(userId, user.roles as string[], selectedRole);
        const refreshToken = generateRefreshToken(userId);

        console.log(`[AUTH] User ${user.name} switched to role: ${selectedRole}`);

        return successResponse(res, {
            accessToken,
            refreshToken,
            selectedRole
        }, `Role switched to ${selectedRole} successfully`);
    } catch (error: any) {
        console.error('Switch role error:', error);
        return errorResponse(res, 'Failed to switch role', 500);
    }
};
