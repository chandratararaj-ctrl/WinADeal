import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

export default function Cart() {
    const navigate = useNavigate();
    const { items, updateQuantity, removeItem, clearCart, getTotalPrice, getTotalItems } = useCartStore();
    const { isAuthenticated } = useAuthStore();

    const deliveryFee = 30;
    const tax = getTotalPrice() * 0.05; // 5% tax
    const total = getTotalPrice() + deliveryFee + tax;

    const handleCheckout = () => {
        if (!isAuthenticated) {
            navigate('/login?redirect=/checkout');
            return;
        }
        navigate('/checkout');
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-8xl mb-6">🛒</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                    <p className="text-gray-600 mb-6">Add items from shops to get started</p>
                    <Link
                        to="/shops"
                        className="inline-flex items-center space-x-2 bg-sky-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-sky-700 transition-colors"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        <span>Browse Shops</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
                        <p className="text-gray-600 mt-1">{getTotalItems()} items</p>
                    </div>
                    <button
                        onClick={clearCart}
                        className="text-red-600 hover:text-red-700 font-medium"
                    >
                        Clear Cart
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Shop Info */}
                        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900">
                                Ordering from: {items[0].shopName}
                            </h3>
                        </div>

                        {/* Items */}
                        {items.map((item) => (
                            <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
                                <div className="flex gap-4">
                                    {/* Image */}
                                    <div className="w-24 h-24 bg-gradient-to-br from-sky-200 to-indigo-300 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                onError={(e) => {
                                                    e.currentTarget.src = `https://placehold.co/100x100?text=${encodeURIComponent(item.name)}`;
                                                }}
                                                alt={item.name}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <span className="text-4xl">🍕</span>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-gray-900 mb-1">{item.name}</h3>
                                        <p className="text-sky-600 font-semibold mb-3">₹{item.price}</p>

                                        <div className="flex items-center justify-between">
                                            {/* Quantity Controls */}
                                            <div className="flex items-center space-x-3 bg-gray-100 rounded-lg px-3 py-2">
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="font-medium w-8 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                onClick={() => removeItem(item.productId)}
                                                className="text-red-600 hover:text-red-700 p-2"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Item Total */}
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-900">
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal ({getTotalItems()} items)</span>
                                    <span>₹{getTotalPrice().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery Fee</span>
                                    <span>₹{deliveryFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax (5%)</span>
                                    <span>₹{tax.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between text-lg font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>₹{total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                className="w-full bg-sky-600 text-white py-3 rounded-lg font-semibold hover:bg-sky-700 transition-colors flex items-center justify-center space-x-2"
                            >
                                <span>Proceed to Checkout</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>

                            {!isAuthenticated && (
                                <p className="text-sm text-gray-600 text-center mt-4">
                                    Please <Link to="/login" className="text-sky-600 hover:underline">login</Link> to continue
                                </p>
                            )}

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <Link
                                    to="/shops"
                                    className="text-sky-600 hover:text-sky-700 font-medium text-sm flex items-center justify-center"
                                >
                                    ← Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
