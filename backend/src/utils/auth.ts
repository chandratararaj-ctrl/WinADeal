import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

/**
 * Compare password with hashed password
 */
export const comparePassword = async (
    password: string,
    hashedPassword: string
): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate JWT access token
 * @param userId - User ID
 * @param roles - Array of all roles the user has
 * @param selectedRole - The role the user is currently using (optional, defaults to first role)
 */
export const generateAccessToken = (userId: string, roles: string[], selectedRole?: string): string => {
    const activeRole = selectedRole || roles[0];
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '15m';

    return jwt.sign(
        { userId, roles, selectedRole: activeRole },
        secret as jwt.Secret,
        { expiresIn } as jwt.SignOptions
    );
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (userId: string): string => {
    const secret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    return jwt.sign(
        { userId },
        secret as jwt.Secret,
        { expiresIn } as jwt.SignOptions
    );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string, isRefreshToken: boolean = false): any => {
    const secret = isRefreshToken
        ? process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
        : process.env.JWT_SECRET || 'your-secret-key';

    return jwt.verify(token, secret as jwt.Secret);
};

/**
 * Generate OTP (6 digits)
 */
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Get OTP expiry time (default: 10 minutes)
 */
export const getOTPExpiry = (): Date => {
    const minutes = parseInt(process.env.OTP_EXPIRES_IN || '10');
    return new Date(Date.now() + minutes * 60 * 1000);
};
