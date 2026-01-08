import express from 'express';
import { authenticate as protect, authorize } from '../middleware/auth.middleware';
import {
    createPayout,
    getPayouts,
    updatePayoutStatus,
    getPayoutStats,
    getVendorBalances,
    getDeliveryPartnerBalances
} from '../controllers/payout.controller';

const router = express.Router();

// Routes
router.post('/', protect, createPayout); // Vendor/Delivery can request, Admin can create
router.get('/', protect, getPayouts);
router.get('/stats', protect, getPayoutStats);
router.get('/vendor-balances', protect, authorize('ADMIN'), getVendorBalances);
router.get('/delivery-partner-balances', protect, authorize('ADMIN'), getDeliveryPartnerBalances);
router.patch('/:id/status', protect, authorize('ADMIN'), updatePayoutStatus);

export default router;
