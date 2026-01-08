import { Router } from 'express';
import { createPaymentOrder, verifyPayment } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/orders', createPaymentOrder);
router.post('/verify', verifyPayment);

export default router;
