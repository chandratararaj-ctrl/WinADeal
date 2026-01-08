import api from './api';


export interface Review {
    id: string;
    orderId: string;
    userId: string;
    shopRating?: number;
    productRating?: number;
    deliveryRating?: number;
    overallRating: number;
    comment?: string;
    images: string[];
    targetType: string;
    targetId: string;
    vendorResponse?: string;
    vendorResponseAt?: string;
    isApproved: boolean;
    isFlagged: boolean;
    helpfulCount: number;
    notHelpfulCount: number;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        name: string;
    };
    order?: {
        orderNumber: string;
        shop?: {
            name: string;
        };
    };
}

export interface ShopReviewsResponse {
    reviews: Review[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
    stats: {
        averageRatings: {
            shopRating: number;
            productRating: number;
            deliveryRating: number;
            overallRating: number;
        };
        ratingDistribution: Array<{
            rating: number;
            count: number;
        }>;
    };
}

export const reviewService = {
    // Get shop reviews (vendor's own shop)
    async getShopReviews(
        shopId: string,
        page = 1,
        limit = 10,
        rating?: number
    ): Promise<ShopReviewsResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        if (rating) {
            params.append('rating', rating.toString());
        }

        const response = await api.get(`/reviews/shop/${shopId}?${params.toString()}`);
        return response.data;
    },

    // Respond to a review
    async respondToReview(reviewId: string, response: string): Promise<Review> {
        const res = await api.post(`/reviews/${reviewId}/respond`, { response });
        return res.data;
    }
};


