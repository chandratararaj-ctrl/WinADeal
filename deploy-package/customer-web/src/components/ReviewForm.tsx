import { useState } from 'react';
import { Star, Upload, X } from 'lucide-react';
import { reviewService, type CreateReviewData } from '../services/review.service';
import { toast } from 'react-hot-toast';

interface ReviewFormProps {
    orderId: string;
    shopId: string;
    shopName: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function ReviewForm({ orderId, shopId, shopName, onSuccess, onCancel }: ReviewFormProps) {
    const [shopRating, setShopRating] = useState(0);
    const [productRating, setProductRating] = useState(0);
    const [deliveryRating, setDeliveryRating] = useState(0);
    const [comment, setComment] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (shopRating === 0 || productRating === 0 || deliveryRating === 0) {
            toast.error('Please provide all ratings');
            return;
        }

        try {
            setIsSubmitting(true);

            const reviewData: CreateReviewData = {
                orderId,
                shopRating,
                productRating,
                deliveryRating,
                comment: comment.trim() || undefined,
                images,
                targetType: 'shop',
                targetId: shopId
            };

            await reviewService.createReview(reviewData);
            toast.success('Review submitted successfully!');

            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error('Failed to submit review:', error);
            toast.error(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setIsSubmitting(false);
        }
    };

    const StarRating = ({
        value,
        onChange,
        label
    }: {
        value: number;
        onChange: (rating: number) => void;
        label: string;
    }) => (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                    >
                        <Star
                            className={`w-8 h-8 ${star <= value
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                        />
                    </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                    {value > 0 ? `${value} star${value > 1 ? 's' : ''}` : 'Not rated'}
                </span>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
                <p className="text-gray-600 mt-1">Share your experience with {shopName}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Shop Rating */}
                <StarRating
                    value={shopRating}
                    onChange={setShopRating}
                    label="Shop Service"
                />

                {/* Product Rating */}
                <StarRating
                    value={productRating}
                    onChange={setProductRating}
                    label="Product Quality"
                />

                {/* Delivery Rating */}
                <StarRating
                    value={deliveryRating}
                    onChange={setDeliveryRating}
                    label="Delivery Service"
                />

                {/* Comment */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Your Review (Optional)
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Tell us about your experience..."
                    />
                </div>

                {/* Image Upload Placeholder */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Add Photos (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                            Click to upload photos (Coming soon)
                        </p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
