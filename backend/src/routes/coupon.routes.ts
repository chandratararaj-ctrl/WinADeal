import { Router } from 'express';
import { createCoupon, getCoupons, updateCoupon, deleteCoupon, verifyCoupon } from '../controllers/coupon.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// Public check (authenticated users only)
router.post('/verify', authenticate, verifyCoupon);

// Admin Routes
router.post('/', authenticate, authorize(['ADMIN']), createCoupon);
router.get('/', authenticate, authorize(['ADMIN', 'VENDOR']), getCoupons);
router.patch('/:id', authenticate, authorize(['ADMIN']), updateCoupon);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteCoupon);

export default router;
