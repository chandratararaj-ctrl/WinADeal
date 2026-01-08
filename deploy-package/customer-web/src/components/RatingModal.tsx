import { useState } from 'react';
import { Star, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface RatingModalProps {
    orderId: string;
    orderNumber: string;
    shopName: string;
    onClose: () => void;
    onSubmit: (rating: number, review: string, deliveryRating: number) => Promise<void>;
}

export default function RatingModal({ orderId, orderNumber, shopName, onClose, onSubmit }: RatingModalProps) {
    const [shopRating, setShopRating] = useState(0);
    const [deliveryRating, setDeliveryRating] = useState(0);
    const [hoveredShopStar, setHoveredShopStar] = useState(0);
    const [hoveredDeliveryStar, setHoveredDeliveryStar] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (shopRating === 0) {
            toast.error('Please rate the shop');
            return;
        }
        if (deliveryRating === 0) {
            toast.error('Please rate the delivery');
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit(shopRating, review, deliveryRating);
            toast.success('Thank you for your feedback!');
            onClose();
        } catch (error) {
            toast.error('Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const StarRating = ({
        rating,
        setRating,
        hovered,
        setHovered,
        label
    }: {
        rating: number;
        setRating: (r: number) => void;
        hovered: number;
        setHovered: (r: number) => void;
        label: string;
    }) => (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        className="transition-transform hover:scale-125"
                    >
                        <Star
                            className={`w-10 h-10 ${star <= (hovered || rating)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                } transition-colors`}
                        />
                    </button>
                ))}
            </div>
            <p className="text-sm text-gray-500">
                {rating === 0 ? 'Tap to rate' :
                    rating === 1 ? 'Poor' :
                        rating === 2 ? 'Fair' :
                            rating === 3 ? 'Good' :
                                rating === 4 ? 'Very Good' :
                                    'Excellent'}
            </p>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-screen items-center justify-center p-4">
                <div
                    className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-auto overflow-hidden transform transition-all animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-4 text-white">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-bold">Rate Your Order</h2>
                        <p className="text-sky-100 text-sm mt-1">Order #{orderNumber}</p>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Shop Info */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600">Shop</p>
                            <p className="font-semibold text-gray-900">{shopName}</p>
                        </div>

                        {/* Shop Rating */}
                        <StarRating
                            rating={shopRating}
                            setRating={setShopRating}
                            hovered={hoveredShopStar}
                            setHovered={setHoveredShopStar}
                            label="How was the food quality?"
                        />

                        {/* Delivery Rating */}
                        <StarRating
                            rating={deliveryRating}
                            setRating={setDeliveryRating}
                            hovered={hoveredDeliveryStar}
                            setHovered={setHoveredDeliveryStar}
                            label="How was the delivery experience?"
                        />

                        {/* Review Text */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Write a review (optional)
                            </label>
                            <textarea
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                placeholder="Share your experience..."
                                rows={4}
                                maxLength={500}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                            />
                            <p className="text-xs text-gray-500 text-right">
                                {review.length}/500 characters
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting || shopRating === 0 || deliveryRating === 0}
                            className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-sky-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
