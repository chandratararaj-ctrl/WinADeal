import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// Admin Analytics - Only accessible by admins
router.get(
    '/admin',
    authenticate,
    authorize(['ADMIN']),
    analyticsController.getAdminAnalytics
);

// Vendor Analytics - Only accessible by vendors
router.get(
    '/vendor',
    authenticate,
    authorize(['VENDOR']),
    analyticsController.getVendorAnalytics
);

// Delivery Partner Analytics - Only accessible by delivery partners
router.get(
    '/delivery',
    authenticate,
    authorize(['DELIVERY_PARTNER']),
    analyticsController.getDeliveryAnalytics
);

export default router;
