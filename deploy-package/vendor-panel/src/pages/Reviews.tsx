import { useState, useEffect } from 'react';
import { reviewService, type Review, type ShopReviewsResponse } from '../services/review.service';
import { useAuthStore } from '../store/authStore';
import { Star, MessageSquare, TrendingUp, Filter } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from '../utils/toast';

export default function Reviews() {
    const { user } = useAuthStore();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ShopReviewsResponse['stats'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterRating, setFilterRating] = useState<number | undefined>();
    const [respondingTo, setRespondingTo] = useState<string | null>(null);
    const [response, setResponse] = useState('');

    useEffect(() => {
        if (user?.shop?.id) {
            fetchReviews();
        }
    }, [user, page, filterRating]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const data = await reviewService.getShopReviews(user!.shop!.id, page, 10, filterRating);
            setReviews(data.reviews);
            setStats(data.stats);
            setTotalPages(data.pagination.pages);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (reviewId: string) => {
        if (!response.trim()) {
            toast.error('Please enter a response');
            return;
        }

        try {
            await reviewService.respondToReview(reviewId, response);
            toast.success('Response submitted successfully');
            setRespondingTo(null);
            setResponse('');
            fetchReviews();
        } catch (error) {
            console.error('Failed to respond:', error);
            toast.error('Failed to submit response');
        }
    };

    const StarDisplay = ({ rating }: { rating: number }) => (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                />
            ))}
        </div>
    );

    if (loading && reviews.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" text="Loading reviews..." />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
                <p className="text-gray-600 mt-1">Manage and respond to customer feedback</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Overall Rating</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats.averageRatings.overallRating?.toFixed(1) || '0.0'}
                                </p>
                            </div>
                            <div className="bg-yellow-100 p-4 rounded-xl">
                                <Star className="w-8 h-8 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Shop Service</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats.averageRatings.shopRating?.toFixed(1) || '0.0'}
                                </p>
                            </div>
                            <div className="bg-blue-100 p-4 rounded-xl">
                                <TrendingUp className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Product Quality</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats.averageRatings.productRating?.toFixed(1) || '0.0'}
                                </p>
                            </div>
                            <div className="bg-green-100 p-4 rounded-xl">
                                <Star className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Delivery</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats.averageRatings.deliveryRating?.toFixed(1) || '0.0'}
                                </p>
                            </div>
                            <div className="bg-purple-100 p-4 rounded-xl">
                                <Star className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rating Distribution */}
            {stats && stats.ratingDistribution.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Rating Distribution</h2>
                    <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const dist = stats.ratingDistribution.find(d => d.rating === rating);
                            const count = dist?.count || 0;
                            const total = stats.ratingDistribution.reduce((sum, d) => sum + d.count, 0);
                            const percentage = total > 0 ? (count / total) * 100 : 0;

                            return (
                                <div key={rating} className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-gray-700 w-12">{rating} star</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-yellow-400 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-4">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Filter by rating:</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterRating(undefined)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterRating === undefined
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All
                        </button>
                        {[5, 4, 3, 2, 1].map((rating) => (
                            <button
                                key={rating}
                                onClick={() => setFilterRating(rating)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterRating === rating
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {rating} ⭐
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No reviews yet</p>
                        <p className="text-gray-400 text-sm mt-1">
                            {filterRating ? 'No reviews with this rating' : 'Your customers will see their reviews here'}
                        </p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div
                            key={review.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            {/* Review Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {review.user?.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{review.user?.name}</h4>
                                        <p className="text-sm text-gray-500">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    <span className="font-bold text-gray-900">{review.overallRating}</span>
                                </div>
                            </div>

                            {/* Rating Breakdown */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                {review.shopRating && (
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Shop</p>
                                        <StarDisplay rating={review.shopRating} />
                                    </div>
                                )}
                                {review.productRating && (
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Product</p>
                                        <StarDisplay rating={review.productRating} />
                                    </div>
                                )}
                                {review.deliveryRating && (
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Delivery</p>
                                        <StarDisplay rating={review.deliveryRating} />
                                    </div>
                                )}
                            </div>

                            {/* Comment */}
                            {review.comment && (
                                <p className="text-gray-700 mb-4">{review.comment}</p>
                            )}

                            {/* Vendor Response */}
                            {review.vendorResponse ? (
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-semibold text-blue-900">Your Response</span>
                                    </div>
                                    <p className="text-sm text-blue-900">{review.vendorResponse}</p>
                                </div>
                            ) : (
                                <div className="mt-4">
                                    {respondingTo === review.id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={response}
                                                onChange={(e) => setResponse(e.target.value)}
                                                rows={3}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                placeholder="Write your response..."
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRespond(review.id)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    Submit Response
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setRespondingTo(null);
                                                        setResponse('');
                                                    }}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setRespondingTo(review.id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            Respond to Review
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
