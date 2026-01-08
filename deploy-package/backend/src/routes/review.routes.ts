import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// Customer routes - Create and view reviews
router.post(
    '/',
    authenticate,
    authorize(['CUSTOMER']),
    reviewController.createReview
);

router.get(
    '/my-reviews',
    authenticate,
    authorize(['CUSTOMER']),
    reviewController.getUserReviews
);

// Public routes - View reviews
router.get(
    '/shop/:shopId',
    reviewController.getShopReviews
);

router.get(
    '/delivery-partner/:deliveryPartnerId',
    reviewController.getDeliveryPartnerReviews
);

// Mark review as helpful (any authenticated user)
router.post(
    '/:reviewId/helpful',
    authenticate,
    reviewController.markHelpful
);

// Vendor routes - Respond to reviews
router.post(
    '/:reviewId/respond',
    authenticate,
    authorize(['VENDOR']),
    reviewController.respondToReview
);

// Admin routes - Moderation
router.get(
    '/admin/all',
    authenticate,
    authorize(['ADMIN']),
    reviewController.getAllReviews
);

router.patch(
    '/admin/:reviewId/moderate',
    authenticate,
    authorize(['ADMIN']),
    reviewController.moderateReview
);

export default router;
