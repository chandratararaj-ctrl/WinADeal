import express from 'express';
import {
    getAllCities,
    getActiveCities,
    getAvailableCities,
    getShopsByCity,
    createCity,
    updateCity,
    deleteCity,
    getCityStats
} from '../controllers/city.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes - no authentication required
router.get('/all', getAllCities); // Get all cities (admin uses this, shows inactive too)
router.get('/active', getActiveCities); // Get active cities only (for dropdowns)
router.get('/available', getAvailableCities); // Get cities with shops (for customer)
router.get('/shops', getShopsByCity); // Get shops by city

// Admin routes - authentication and admin role required
router.post('/', authenticate, authorize('ADMIN'), createCity);
router.put('/:id', authenticate, authorize('ADMIN'), updateCity);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCity);
router.get('/stats', authenticate, authorize('ADMIN'), getCityStats);

export default router;
