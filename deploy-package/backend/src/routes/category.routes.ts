import { Router } from 'express';
import { getCategories, getCategoryById } from '../controllers/product.controller';

const router = Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);

export default router;
