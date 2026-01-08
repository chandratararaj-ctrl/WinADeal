import express from 'express';
import { authenticate as protect, authorize } from '../middleware/auth.middleware';
import { getDeliverySettings, updateDeliverySettings, getSettingHistory } from '../controllers/settings.controller';

const router = express.Router();

// Public read or Auth-only read?
// Usually app needs to know delivery fees upfront (or at least the calculation logic).
// However, calculateDeliveryFee is done on backend.
// Admin needs to read/write.
// Maybe allow authenticated users to read? Or just internal use.
// For now, let's allow Admin to manage.

router.get('/delivery', protect, authorize('ADMIN'), getDeliverySettings);
router.put('/delivery', protect, authorize('ADMIN'), updateDeliverySettings);
router.get('/history', protect, authorize('ADMIN'), getSettingHistory);

export default router;
