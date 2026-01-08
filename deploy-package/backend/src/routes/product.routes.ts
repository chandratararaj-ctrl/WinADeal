import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller';

import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected routes (Admin & Vendor)
router.post('/', authenticate, authorize('ADMIN', 'VENDOR'), createProduct);
router.put('/:id', authenticate, authorize('ADMIN', 'VENDOR'), updateProduct);
router.delete('/:id', authenticate, authorize('ADMIN', 'VENDOR'), deleteProduct);

export default router;
