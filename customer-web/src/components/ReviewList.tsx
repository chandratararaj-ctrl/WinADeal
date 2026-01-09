import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { type Review } from '../services/review.service';
import { reviewService } from '../services/review.service';
import { toast } from 'react-hot-toast';

interface ReviewListProps {
    reviews: Review[];
    showVendorResponse?: boolean;
}

export default function ReviewList({ reviews, showVendorResponse = true }: ReviewListProps) {
    const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});

    const handleHelpful = async (reviewId: string, helpful: boolean) => {
        try {
            await reviewService.markHelpful(reviewId, helpful);
            setHelpfulVotes({ ...helpfulVotes, [reviewId]: helpful });
            toast.success(helpful ? 'Marked as helpful' : 'Marked as not helpful');
        } catch (error) {
            console.error('Failed to mark review:', error);
            toast.error('Failed to update review');
        }
    };

    const StarDisplay = ({ rating }: { rating: number }) => (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                        }`}
                />
            ))}
        </div>
    );

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No reviews yet</p>
                <p className="text-gray-400 text-sm mt-1">Be the first to review!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {reviews.map((review) => (
                <div
                    key={review.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {review.user?.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">{review.user?.name}</h4>
                                <p className="text-sm text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-gray-900">{review.overallRating.toFixed(1)}</span>
                        </div>
                    </div>

                    {/* Ratings Breakdown */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        {review.shopRating && (
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Shop Service</p>
                                <StarDisplay rating={review.shopRating} />
                            </div>
                        )}
                        {review.productRating && (
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Product Quality</p>
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
                        <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
                    )}

                    {/* Images */}
                    {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mb-4">
                            {review.images.map((image: string, index: number) => (
                                <img
                                    key={index}
                                    src={image}
                                    alt={`Review ${index + 1}`}
                                    className="w-24 h-24 object-cover rounded-lg"
                                />
                            ))}
                        </div>
                    )}

                    {/* Vendor Response */}
                    {showVendorResponse && review.vendorResponse && (
                        <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                            <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-semibold text-blue-900">Vendor Response</span>
                                {review.vendorResponseAt && (
                                    <span className="text-xs text-blue-600">
                                        {new Date(review.vendorResponseAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-blue-900">{review.vendorResponse}</p>
                        </div>
                    )}

                    {/* Helpful Votes */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-600">Was this helpful?</span>
                        <button
                            onClick={() => handleHelpful(review.id, true)}
                            disabled={helpfulVotes[review.id] !== undefined}
                            className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ThumbsUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">
                                {review.helpfulCount}
                            </span>
                        </button>
                        <button
                            onClick={() => handleHelpful(review.id, false)}
                            disabled={helpfulVotes[review.id] !== undefined}
                            className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ThumbsDown className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-gray-700">
                                {review.notHelpfulCount}
                            </span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
