import express from 'express';
import { authenticate as protect, authorize } from '../middleware/auth.middleware';
import {
    updateVendorCommission,
    updateDeliveryPartnerCommission,
    getCommissionHistory,
    getDefaultRates
} from '../controllers/commission.controller';

const router = express.Router();

// All routes require admin authentication
router.use(protect, authorize('ADMIN'));

// Commission management routes
router.patch('/vendor/:shopId', updateVendorCommission);
router.patch('/delivery/:partnerId', updateDeliveryPartnerCommission);
router.get('/history', getCommissionHistory);
router.get('/defaults', getDefaultRates);

export default router;
