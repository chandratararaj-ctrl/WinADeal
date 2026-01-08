import express from 'express';
import { authenticate as protect, authorize } from '../middleware/auth.middleware';
import {
    getPendingRequests,
    acceptRequest,
    rejectRequest,
    getRequestHistory,
    getPenaltySummary,
    updateLocation
} from '../controllers/deliveryRequest.controller';

const router = express.Router();

// All routes require delivery partner authentication
router.use(protect, authorize('DELIVERY'));

// Get pending delivery requests
router.get('/pending', getPendingRequests);

// Accept a delivery request
router.post('/:requestId/accept', acceptRequest);

// Reject a delivery request
router.post('/:requestId/reject', rejectRequest);

// Get request history
router.get('/history', getRequestHistory);

// Get penalty summary
router.get('/penalties', getPenaltySummary);

// Update current location
router.post('/location', updateLocation);

export default router;
