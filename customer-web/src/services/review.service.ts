import api from './api';

export interface CreateReviewData {
    orderId: string;
    targetType: 'shop' | 'delivery' | 'product';
    targetId: string;
    shopRating?: number;
    productRating?: number;
    deliveryRating?: number;
    overallRating?: number;
    comment?: string;
    images?: string[];
}

export interface Review {
    id: string;
    userId: string;
    orderId: string;
    shopRating: number;
    productRating: number;
    deliveryRating: number;
    overallRating: number;
    comment: string;
    user: {
        name: string;
    };
    createdAt: string;
    images?: string[];
    vendorResponse?: string;
    vendorResponseAt?: string;
    helpfulCount: number;
    notHelpfulCount: number;
}

export const reviewService = {
    // Create new review
    createReview: async (data: CreateReviewData) => {
        const response = await api.post('/reviews', data);
        return response.data;
    },

    // Get my reviews
    getMyReviews: async () => {
        const response = await api.get('/reviews/my-reviews');
        return response.data.data;
    },

    // Get shop reviews
    getShopReviews: async (shopId: string) => {
        const response = await api.get(`/reviews/shop/${shopId}`);
        return response.data;
    },

    // Mark review as helpful
    markHelpful: async (reviewId: string, helpful: boolean) => {
        const response = await api.post(`/reviews/${reviewId}/helpful`, { helpful });
        return response.data;
    }
};
