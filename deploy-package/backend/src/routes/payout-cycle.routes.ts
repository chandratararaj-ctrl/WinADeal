import express from 'express';
import { authenticate as protect, authorize } from '../middleware/auth.middleware';
import {
    createPayoutCycle,
    getPayoutCycles,
    getActiveCycle,
    getPayoutCycleById,
    calculatePendingPayouts,
    closePayoutCycle
} from '../controllers/payout-cycle.controller';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public routes (vendors and delivery partners can view cycles)
router.get('/', getPayoutCycles);
router.get('/active', getActiveCycle);
router.get('/:id', getPayoutCycleById);
router.get('/:id/pending', calculatePendingPayouts);

// Admin only routes
router.post('/', authorize('ADMIN'), createPayoutCycle);
router.post('/:id/close', authorize('ADMIN'), closePayoutCycle);

export default router;
