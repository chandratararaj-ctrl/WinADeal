import { Router } from 'express';
import { getUsers, updateUserStatus } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All user management routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get('/', getUsers);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update user status (Admin only)
 * @access  Private/Admin
 */
router.patch('/:id', updateUserStatus);

export default router;
