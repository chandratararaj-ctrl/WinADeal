import { Router } from 'express';
import { trackingController } from '../controllers/tracking.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// Delivery Partner routes - Manage tracking
router.post(
    '/:deliveryId/start',
    authenticate,
    authorize(['DELIVERY']),
    trackingController.startTracking
);

router.post(
    '/:deliveryId/location',
    authenticate,
    authorize(['DELIVERY']),
    trackingController.updateLocation
);

router.post(
    '/:deliveryId/route',
    authenticate,
    authorize(['DELIVERY']),
    trackingController.updateRoute
);

router.post(
    '/:deliveryId/stop',
    authenticate,
    authorize(['DELIVERY']),
    trackingController.stopTracking
);

router.get(
    '/active',
    authenticate,
    authorize(['DELIVERY']),
    trackingController.getActiveDeliveries
);

// Public/Customer routes - View tracking
router.get(
    '/:deliveryId',
    trackingController.getDeliveryLocation
);

router.get(
    '/:deliveryId/history',
    trackingController.getLocationHistory
);

export default router;
