import { Router } from 'express';
import { getOrders, getOrderById, updateOrderStatus, createOrder, cancelOrder } from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.use(authenticate);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', authorize('VENDOR', 'ADMIN', 'DELIVERY'), updateOrderStatus);
router.post('/:id/cancel', authorize('CUSTOMER', 'VENDOR', 'ADMIN'), cancelOrder);
router.post('/', createOrder); // Authorization removed to allow any authenticated user

export default router;
