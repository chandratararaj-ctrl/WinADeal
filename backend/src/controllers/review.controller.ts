import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const reviewController = {
    // Create a review
    async createReview(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const {
                orderId,
                shopRating,
                productRating,
                deliveryRating,
                overallRating,
                comment,
                images,
                targetType,
                targetId
            } = req.body;

            console.log('[CreateReview] Request:', { orderId, userId, targetType, targetId, shopRating });

            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // Verify order belongs to user
            // Note: We allow review if order is DELIVERED. 
            // If the frontend allows reviewing earlier (e.g. delivered but status not updated), we might relax this.
            // For now, sticking to DELIVERED.
            const order = await prisma.order.findFirst({
                where: {
                    id: orderId,
                    customerId: userId
                }
            });

            if (!order) {
                console.error('[CreateReview] Order not found for user:', orderId, userId);
                return res.status(404).json({ message: 'Order not found' });
            }

            if (order.status !== 'DELIVERED') {
                console.error('[CreateReview] Order not delivered. Status:', order.status);
                // Allow reviewing if it's practically delivered? For now, fail but with 400.
                return res.status(400).json({ message: `Order status is ${order.status}, must be DELIVERED to review` });
            }

            // Check if review already exists
            const existingReview = await prisma.review.findUnique({
                where: { orderId }
            });

            if (existingReview) {
                return res.status(400).json({ message: 'Review already exists for this order' });
            }

            // Safe calculation for overallRating
            const ratings = [shopRating, productRating, deliveryRating].filter(r => r !== undefined && r !== null && typeof r === 'number');
            const calculatedOverall = ratings.length > 0
                ? Math.round(ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length)
                : (shopRating || 0);

            const finalOverallRating = overallRating || calculatedOverall;

            console.log('[CreateReview] Creating review with overall rating:', finalOverallRating);

            // Create review
            const review = await prisma.review.create({
                data: {
                    orderId,
                    userId,
                    shopRating: shopRating,
                    productRating: productRating,
                    deliveryRating: deliveryRating,
                    overallRating: finalOverallRating,
                    comment,
                    images: images || [],
                    targetType,
                    targetId
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            // Update metrics asynchronously (don't fail request if this fails)
            try {
                if (targetType === 'shop') {
                    await updateShopRating(targetId);
                } else if (targetType === 'delivery') {
                    await updateDeliveryPartnerRating(targetId);
                }
            } catch (metricError) {
                console.error('[CreateReview] Failed to update metrics:', metricError);
                // Continue, don't crash
            }

            res.status(201).json(review);
        } catch (error) {
            console.error('[CreateReview] Error creating review:', error);
            res.status(500).json({ message: 'Failed to create review', error: String(error) });
        }
    },

    // Get reviews for a shop
    async getShopReviews(req: Request, res: Response) {
        try {
            const { shopId } = req.params;
            const { page = 1, limit = 10, rating } = req.query;

            const skip = (Number(page) - 1) * Number(limit);

            const where: any = {
                targetType: 'shop',
                targetId: shopId,
                isApproved: true
            };

            if (rating) {
                where.shopRating = Number(rating);
            }

            const [reviews, total] = await Promise.all([
                prisma.review.findMany({
                    where,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    skip,
                    take: Number(limit)
                }),
                prisma.review.count({ where })
            ]);

            // Calculate rating distribution
            const ratingDistribution = await prisma.review.groupBy({
                by: ['shopRating'],
                where: {
                    targetType: 'shop',
                    targetId: shopId,
                    isApproved: true
                },
                _count: true
            });

            // Calculate average ratings
            const avgRatings = await prisma.review.aggregate({
                where: {
                    targetType: 'shop',
                    targetId: shopId,
                    isApproved: true
                },
                _avg: {
                    shopRating: true,
                    productRating: true,
                    deliveryRating: true,
                    overallRating: true
                }
            });

            res.json({
                reviews,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                },
                stats: {
                    averageRatings: avgRatings._avg,
                    ratingDistribution: ratingDistribution.map(r => ({
                        rating: r.shopRating,
                        count: r._count
                    }))
                }
            });
        } catch (error) {
            console.error('Error fetching shop reviews:', error);
            res.status(500).json({ message: 'Failed to fetch reviews' });
        }
    },

    // Get reviews for a delivery partner
    async getDeliveryPartnerReviews(req: Request, res: Response) {
        try {
            const { deliveryPartnerId } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const skip = (Number(page) - 1) * Number(limit);

            const [reviews, total] = await Promise.all([
                prisma.review.findMany({
                    where: {
                        targetType: 'delivery',
                        targetId: deliveryPartnerId,
                        isApproved: true
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    skip,
                    take: Number(limit)
                }),
                prisma.review.count({
                    where: {
                        targetType: 'delivery',
                        targetId: deliveryPartnerId,
                        isApproved: true
                    }
                })
            ]);

            // Calculate average delivery rating
            const avgRating = await prisma.review.aggregate({
                where: {
                    targetType: 'delivery',
                    targetId: deliveryPartnerId,
                    isApproved: true
                },
                _avg: {
                    deliveryRating: true
                }
            });

            res.json({
                reviews,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                },
                stats: {
                    averageRating: avgRating._avg.deliveryRating
                }
            });
        } catch (error) {
            console.error('Error fetching delivery partner reviews:', error);
            res.status(500).json({ message: 'Failed to fetch reviews' });
        }
    },

    // Vendor responds to a review
    async respondToReview(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const { reviewId } = req.params;
            const { response } = req.body;

            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // Get vendor's shop
            const shop = await prisma.shop.findFirst({
                where: { userId }
            });

            if (!shop) {
                return res.status(404).json({ message: 'Shop not found' });
            }

            // Verify review is for this shop
            const review = await prisma.review.findFirst({
                where: {
                    id: reviewId,
                    targetType: 'shop',
                    targetId: shop.id
                }
            });

            if (!review) {
                return res.status(404).json({ message: 'Review not found' });
            }

            // Update review with vendor response
            const updatedReview = await prisma.review.update({
                where: { id: reviewId },
                data: {
                    vendorResponse: response,
                    vendorResponseAt: new Date()
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            res.json(updatedReview);
        } catch (error) {
            console.error('Error responding to review:', error);
            res.status(500).json({ message: 'Failed to respond to review' });
        }
    },

    // Mark review as helpful
    async markHelpful(req: Request, res: Response) {
        try {
            const { reviewId } = req.params;
            const { helpful } = req.body; // true for helpful, false for not helpful

            const review = await prisma.review.update({
                where: { id: reviewId },
                data: {
                    ...(helpful
                        ? { helpfulCount: { increment: 1 } }
                        : { notHelpfulCount: { increment: 1 } })
                }
            });

            res.json(review);
        } catch (error) {
            console.error('Error marking review as helpful:', error);
            res.status(500).json({ message: 'Failed to update review' });
        }
    },

    // Admin: Get all reviews for moderation
    async getAllReviews(req: Request, res: Response) {
        try {
            const { page = 1, limit = 20, flagged, approved } = req.query;

            const skip = (Number(page) - 1) * Number(limit);

            const where: any = {};

            if (flagged !== undefined) {
                where.isFlagged = flagged === 'true';
            }

            if (approved !== undefined) {
                where.isApproved = approved === 'true';
            }

            const [reviews, total] = await Promise.all([
                prisma.review.findMany({
                    where,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        },
                        order: {
                            select: {
                                orderNumber: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    skip,
                    take: Number(limit)
                }),
                prisma.review.count({ where })
            ]);

            res.json({
                reviews,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error) {
            console.error('Error fetching reviews:', error);
            res.status(500).json({ message: 'Failed to fetch reviews' });
        }
    },

    // Admin: Moderate review
    async moderateReview(req: Request, res: Response) {
        try {
            const { reviewId } = req.params;
            const { isApproved, isFlagged, moderationNote } = req.body;

            const review = await prisma.review.update({
                where: { id: reviewId },
                data: {
                    isApproved,
                    isFlagged,
                    moderationNote
                }
            });

            res.json(review);
        } catch (error) {
            console.error('Error moderating review:', error);
            res.status(500).json({ message: 'Failed to moderate review' });
        }
    },

    // Get user's reviews
    async getUserReviews(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const reviews = await prisma.review.findMany({
                where: { userId },
                include: {
                    order: {
                        select: {
                            orderNumber: true,
                            shop: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            res.json(reviews);
        } catch (error) {
            console.error('Error fetching user reviews:', error);
            res.status(500).json({ message: 'Failed to fetch reviews' });
        }
    }
};

// Helper function to update shop rating
async function updateShopRating(shopId: string) {
    const avgRating = await prisma.review.aggregate({
        where: {
            targetType: 'shop',
            targetId: shopId,
            isApproved: true
        },
        _avg: {
            shopRating: true
        }
    });

    if (avgRating._avg.shopRating) {
        await prisma.shop.update({
            where: { id: shopId },
            data: {
                rating: avgRating._avg.shopRating
            }
        });
    }
}

// Helper function to update delivery partner rating
async function updateDeliveryPartnerRating(deliveryPartnerId: string) {
    const avgRating = await prisma.review.aggregate({
        where: {
            targetType: 'delivery',
            targetId: deliveryPartnerId,
            isApproved: true
        },
        _avg: {
            deliveryRating: true
        }
    });

    if (avgRating._avg.deliveryRating) {
        await prisma.deliveryPartner.update({
            where: { id: deliveryPartnerId },
            data: {
                rating: avgRating._avg.deliveryRating
            }
        });
    }
}
