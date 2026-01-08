import { X, Plus, Minus, ShoppingCart, Star } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    discountedPrice?: number;
    images: string[];
    isVeg: boolean;
    isAvailable: boolean;
    stockQuantity?: number;
}

interface ProductQuickViewProps {
    product: Product;
    onClose: () => void;
    onAddToCart: (productId: string, quantity: number) => void;
}

export default function ProductQuickView({ product, onClose, onAddToCart }: ProductQuickViewProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    const price = product.discountedPrice || product.price;
    const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;

    const handleAddToCart = () => {
        if (!product.isAvailable) {
            toast.error('Product is currently unavailable');
            return;
        }
        if (product.stockQuantity !== undefined && quantity > product.stockQuantity) {
            toast.error(`Only ${product.stockQuantity} items available`);
            return;
        }
        onAddToCart(product.id, quantity);
        toast.success(`Added ${quantity} ${product.name} to cart`);
        onClose();
    };

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
                    className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto overflow-hidden transform transition-all animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                        {/* Left: Images */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                                {product.images && product.images.length > 0 ? (
                                    <img
                                        src={product.images[selectedImage]}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-6xl">
                                        {product.isVeg ? '🥗' : '🍗'}
                                    </div>
                                )}

                                {/* Badges */}
                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                    {product.isVeg ? (
                                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                            <span className="w-2 h-2 bg-white rounded-full"></span>
                                            Veg
                                        </span>
                                    ) : (
                                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                            <span className="w-2 h-2 bg-white rounded-full"></span>
                                            Non-Veg
                                        </span>
                                    )}
                                    {hasDiscount && (
                                        <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                            {Math.round(((product.price - product.discountedPrice!) / product.price) * 100)}% OFF
                                        </span>
                                    )}
                                </div>

                                {!product.isAvailable && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <span className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold text-lg">
                                            Out of Stock
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Images */}
                            {product.images && product.images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto">
                                    {product.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(idx)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-sky-600 scale-105' : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Details */}
                        <div className="flex flex-col">
                            <div className="flex-1">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h2>

                                {/* Rating (placeholder) */}
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-600">(4.5)</span>
                                </div>

                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-4xl font-bold text-gray-900">₹{price}</span>
                                        {hasDiscount && (
                                            <span className="text-xl text-gray-400 line-through">₹{product.price}</span>
                                        )}
                                    </div>
                                    {product.stockQuantity !== undefined && product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                                        <p className="text-sm text-orange-600 mt-2">
                                            Only {product.stockQuantity} left in stock!
                                        </p>
                                    )}
                                </div>

                                {/* Description */}
                                {product.description && (
                                    <div className="mb-6">
                                        <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                                        <p className="text-gray-600 leading-relaxed">{product.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="border-t pt-6 space-y-4">
                                {/* Quantity Selector */}
                                <div className="flex items-center gap-4">
                                    <span className="font-medium text-gray-700">Quantity:</span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            disabled={quantity <= 1}
                                            className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-sky-600 hover:text-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Minus className="w-5 h-5" />
                                        </button>
                                        <span className="text-xl font-bold text-gray-900 w-12 text-center">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            disabled={product.stockQuantity !== undefined && quantity >= product.stockQuantity}
                                            className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-sky-600 hover:text-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Add to Cart Button */}
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!product.isAvailable}
                                    className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:from-sky-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                                >
                                    <ShoppingCart className="w-6 h-6" />
                                    {product.isAvailable ? `Add to Cart - ₹${price * quantity}` : 'Out of Stock'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
