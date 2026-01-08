import express from 'express';
import {
    getAllCityCommissions,
    getCityCommission,
    upsertCityCommission,
    deleteCityCommission,
    getCommissionRates,
    bulkUpsertCityCommissions
} from '../controllers/cityCommission.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Public route - get commission rates for a city
router.get('/rates', getCommissionRates);

// Admin-only routes
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAllCityCommissions);
router.get('/:city', getCityCommission);
router.put('/:city', upsertCityCommission);
router.delete('/:city', deleteCityCommission);
router.post('/bulk', bulkUpsertCityCommissions);

export default router;
