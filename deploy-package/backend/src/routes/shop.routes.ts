import { Router } from 'express';
import { getShops, getShopById, getShopProducts, createShop, updateShop, getShopStats } from '../controllers/shop.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', optionalAuth, getShops);
router.get('/:id', getShopById);
router.get('/:id/products', getShopProducts);

// Protected routes
router.get('/:id/stats', authenticate, authorize('VENDOR', 'ADMIN'), getShopStats);
router.post('/', authenticate, authorize('VENDOR', 'ADMIN'), createShop);
router.put('/:id', authenticate, authorize('VENDOR', 'ADMIN'), updateShop);

export default router;
