import { Router } from 'express';
import {
    registerDeliveryPartner,
    getDeliveryPartners,
    verifyDeliveryPartner,
    assignOrder,
    updateDeliveryStatus,
    getMyDeliveries,
    toggleOnlineStatus
} from '../controllers/delivery.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Partner routes (Self)
router.post('/register', registerDeliveryPartner);
router.get('/my-orders', authorize('DELIVERY'), getMyDeliveries);
router.post('/status', authorize('DELIVERY'), toggleOnlineStatus);
router.put('/orders/:orderId/status', authorize('DELIVERY', 'ADMIN'), updateDeliveryStatus);

// Admin routes
router.get('/', authorize('ADMIN', 'VENDOR'), getDeliveryPartners);
router.put('/:id/verify', authorize('ADMIN'), verifyDeliveryPartner);
router.post('/assign', authorize('ADMIN', 'VENDOR'), assignOrder); // Vendor can also assign manually if needed?

export default router;
