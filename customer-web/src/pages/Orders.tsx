import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Truck, MapPin } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/order.service';
import type { Order as ApiOrder } from '../services/order.service';
import { useSocketStore } from '../store/socketStore';
import { OrderCardSkeleton } from '../components/Skeletons';
import ReviewModal from '../components/ReviewModal';
import toast from 'react-hot-toast';

interface Order extends Omit<ApiOrder, 'status' | 'deliveryAddress' | 'items'> {
    status: string;
    deliveryAddress: string;
    verificationCode?: string;
    items: {
        name: string;
        quantity: number;
        price: number;
    }[];
}

export default function Orders() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'completed'>('all');
    const [loading, setLoading] = useState(true);

    const lastEvent = useSocketStore((state) => state.lastEvent);

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login?redirect=/orders');
            return;
        }
        fetchOrders();

        // Poll every 15s
        const interval = setInterval(() => {
            fetchOrders(true);
        }, 15000);

        return () => clearInterval(interval);
    }, [isAuthenticated, selectedTab]); // Re-fetch on tab change too? No, filtering is client side. Yes keep it simple.

    // Listen for socket updates
    useEffect(() => {
        if (lastEvent?.type === 'order_update') {
            fetchOrders(true);
        }
    }, [lastEvent]);

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm('Are you sure you want to cancel this order?')) return;

        try {
            await orderService.cancelOrder(orderId, 'User requested cancellation');
            toast.success('Order cancelled successfully');
            fetchOrders();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        }
    };

    const fetchOrders = async (isBackground = false) => {
        try {
            console.log('[Orders] fetchOrders called, isBackground:', isBackground);
            if (!isBackground) setLoading(true);

            const orders = await orderService.getMyOrders();
            console.log('[Orders] getMyOrders returned:', orders);
            console.log('[Orders] Is array?', Array.isArray(orders));
            console.log('[Orders] Length:', orders?.length);

            // getMyOrders returns the orders array directly
            const fetchedOrders = (Array.isArray(orders) ? orders : []).map((order: any) => {
                console.log('[Orders] Mapping order:', order.id, order.orderNumber);
                return {
                    ...order,
                    items: order.orderItems.map((item: any) => ({
                        name: item.product.name,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    shop: {
                        id: order.shop.id,
                        name: order.shop.name
                    },
                    deliveryAddress: order.deliveryAddress ?
                        `${order.deliveryAddress.addressLine1}, ${order.deliveryAddress.city}` : 'N/A',
                    verificationCode: order.delivery?.verificationCode
                };
            });

            console.log('[Orders] fetchedOrders:', fetchedOrders);
            console.log('[Orders] Setting orders state with', fetchedOrders.length, 'orders');
            setOrders(fetchedOrders);
        } catch (error) {
            console.error('[Orders] Failed to fetch orders:', error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        const iconClass = "w-5 h-5";
        switch (status) {
            case 'PLACED':
            case 'PENDING':
                return <Clock className={`${iconClass} text-yellow-600 animate-pulse`} />;
            case 'ACCEPTED':
            case 'CONFIRMED':
                return <CheckCircle className={`${iconClass} text-blue-600`} />;
            case 'READY':
            case 'PREPARING':
                return <Package className={`${iconClass} text-purple-600 animate-bounce`} />;
            case 'ASSIGNED':
            case 'PICKED_UP':
            case 'EN_ROUTE_TO_PICKUP':
            case 'OUT_FOR_DELIVERY':
                return <Truck className={`${iconClass} text-indigo-600 animate-pulse`} />;
            case 'DELIVERED':
                return <CheckCircle className={`${iconClass} text-green-600`} />;
            case 'CANCELLED':
            case 'REJECTED':
                return <XCircle className={`${iconClass} text-red-600`} />;
            default:
                return <Clock className={`${iconClass} text-gray-600`} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PLACED':
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'ACCEPTED':
            case 'CONFIRMED':
                return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'READY':
            case 'PREPARING':
                return 'bg-purple-100 text-purple-800 border border-purple-200';
            case 'ASSIGNED':
            case 'PICKED_UP':
            case 'EN_ROUTE_TO_PICKUP':
            case 'OUT_FOR_DELIVERY':
                return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
            case 'DELIVERED':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'CANCELLED':
            case 'REJECTED':
                return 'bg-red-100 text-red-800 border border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredOrders = orders.filter(order => {
        if (selectedTab === 'active') {
            return ['PLACED', 'PENDING', 'ACCEPTED', 'CONFIRMED', 'READY', 'PREPARING', 'ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(order.status);
        }
        if (selectedTab === 'completed') {
            return ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.status);
        }
        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
                    <div className="flex space-x-2 mb-6">
                        {['all', 'active', 'completed'].map((tab) => (
                            <div key={tab} className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                        ))}
                    </div>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <OrderCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

                {/* Tabs */}
                <div className="flex space-x-2 mb-6">
                    {['all', 'active', 'completed'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab as any)}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${selectedTab === tab
                                ? 'bg-sky-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
                        <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                        <button
                            onClick={() => navigate('/shops')}
                            className="bg-sky-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-sky-700 transition-colors"
                        >
                            Browse Shops
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => (
                            <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                                {/* Order Header */}
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="font-bold text-gray-900">{order.orderNumber}</h3>
                                                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    <span>{order.status.replace('_', ' ')}</span>
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                                        </div>
                                        <div className="mt-3 md:mt-0 text-right">
                                            <p className="text-sm text-gray-600">Total Amount</p>
                                            <p className="text-2xl font-bold text-gray-900">₹{order.total}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Body */}
                                <div className="px-6 py-4">
                                    <div className="flex items-start space-x-4 mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-3xl">🍕</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 mb-2">{order.shop.name}</h4>
                                            <div className="space-y-1">
                                                {order.items.map((item, idx) => (
                                                    <p key={idx} className="text-sm text-gray-600">
                                                        {item.name} x {item.quantity}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span>{order.deliveryAddress}</span>
                                    </div>

                                    {/* Verification Code Box */}
                                    {order.status === 'OUT_FOR_DELIVERY' && order.verificationCode && (
                                        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Delivery Code</p>
                                                <p className="text-xs text-indigo-700">Share with driver to complete delivery</p>
                                            </div>
                                            <div className="bg-white px-3 py-1 rounded border border-indigo-200 shadow-sm">
                                                <span className="text-xl font-mono font-bold text-indigo-600 tracking-widest">{order.verificationCode}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Order Footer */}
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                                    <button
                                        onClick={() => navigate(`/shops/${order.shop.name.toLowerCase().replace(' ', '-')}`)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
                                    >
                                        Reorder
                                    </button>
                                    {['PLACED', 'PENDING'].includes(order.status) && (
                                        <button
                                            onClick={() => handleCancelOrder(order.id)}
                                            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    {['CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY', 'ASSIGNED', 'PICKED_UP', 'EN_ROUTE_TO_PICKUP', 'OUT_FOR_DELIVERY'].includes(order.status) && (
                                        <button
                                            onClick={() => navigate(`/orders/${order.id}/track`)}
                                            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                                        >
                                            Track Order
                                        </button>
                                    )}
                                    {order.status === 'DELIVERED' && (
                                        <button
                                            onClick={() => {
                                                setSelectedOrderForReview(order);
                                                setIsReviewModalOpen(true);
                                            }}
                                            className="px-4 py-2 border border-sky-600 text-sky-600 rounded-lg hover:bg-sky-50 transition-colors"
                                        >
                                            Rate Order
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedOrderForReview && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    orderId={selectedOrderForReview.id}
                    shopId={selectedOrderForReview.shop.id}
                    shopName={selectedOrderForReview.shop.name}
                />
            )}
        </div>
    );
}
