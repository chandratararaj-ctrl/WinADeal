import { useState, useEffect } from 'react';
import { Navigation, Package, Phone, CheckCircle, MapPin, Navigation2, Radio } from 'lucide-react';
import toast from 'react-hot-toast';
import { deliveryService } from '../services/delivery.service';
import trackingService from '../services/tracking.service';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import { useLocationTracker } from '../hooks/useLocationTracker';
import DeliveryMap from '../components/DeliveryMap';
import VerificationModal from '../components/VerificationModal';

export default function Dashboard() {
    const user = useAuthStore((state) => state.user);
    const [isOnline, setIsOnline] = useState(user?.deliveryPartner?.isOnline || false);
    const [activeOrders, setActiveOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [trackingDeliveryId, setTrackingDeliveryId] = useState<string | null>(null);

    // Verification Modal State
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const lastEvent = useSocketStore((state) => state.lastEvent);

    // Use location tracker hook
    const { isTracking, currentLocation, startTracking, stopTracking } = useLocationTracker({
        deliveryId: trackingDeliveryId,
        enabled: !!trackingDeliveryId,
        updateInterval: 10000 // Update every 10 seconds
    });

    useEffect(() => {
        fetchOrders();

        // Poll every 15s
        const interval = setInterval(() => {
            fetchOrders(true);
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    // Listen for socket events to refresh list
    useEffect(() => {
        if (lastEvent?.type === 'new_delivery') {
            fetchOrders(true);
        }
    }, [lastEvent]);

    const fetchOrders = async (isBackground = false) => {
        try {
            const data = await deliveryService.getMyDeliveries('active');
            setActiveOrders(data);
        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 401) {
                if (!isBackground) {
                    toast.error("Session invalid. Please login again.");
                    useAuthStore.getState().logout();
                    window.location.href = '/login';
                }
                return;
            }
            if (!isBackground) toast.error("Failed to load orders");
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const toggleStatus = async () => {
        try {
            const newState = !isOnline;
            await deliveryService.toggleOnline(newState);
            setIsOnline(newState);
            toast.success(newState ? 'You are now Online' : 'You are now Offline');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleUpdateOrder = async (orderId: string, status: string) => {
        if (status === 'DELIVERED') {
            setVerifyingOrderId(orderId);
            setShowVerifyModal(true);
            return;
        }

        try {
            await deliveryService.updateStatus(orderId, status);
            toast.success(`Order marked as ${status.replace(/_/g, ' ')}`);
            fetchOrders();
        } catch (error) {
            toast.error('Failed to update order');
        }
    };

    const handleVerifySubmit = async (code: string) => {
        if (!verifyingOrderId) return;

        try {
            setIsVerifying(true);
            await deliveryService.updateStatus(verifyingOrderId, 'DELIVERED', code);
            toast.success('Order Delivered Successfully! Great job!');

            // Allow animation frame or slight delay before refresh
            setShowVerifyModal(false);
            setVerifyingOrderId(null);
            fetchOrders();

            // Stop tracking if active for this order
            // We need to find the delivery ID associated with this order
            const relatedDelivery = activeOrders.find(d => d.order.id === verifyingOrderId);
            if (relatedDelivery && trackingDeliveryId === relatedDelivery.id) {
                handleStopTracking();
            }

        } catch (error: any) {
            const msg = error.response?.data?.message || 'Verification failed. Please check the code.';
            toast.error(msg);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleStartTracking = async (deliveryId: string) => {
        setTrackingDeliveryId(deliveryId);
    };

    const handleStopTracking = async () => {
        if (trackingDeliveryId) {
            await stopTracking();
            setTrackingDeliveryId(null);
        }
    };

    const openInGoogleMaps = (latitude: number, longitude: number, label: string) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodeURIComponent(label)}`;
        window.open(url, '_blank');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Hi, {user?.name}</h2>
                    <p className="text-xs text-gray-500">Let's deliver some happiness!</p>
                </div>
                <button
                    onClick={toggleStatus}
                    className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm transition-colors ${isOnline
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                >
                    {isOnline ? '🟢 Online' : '⚪ Offline'}
                </button>
            </div>

            {/* GPS Status Banner */}
            {isTracking && currentLocation && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Radio className="w-6 h-6" />
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></span>
                            </div>
                            <div>
                                <p className="font-semibold">GPS Tracking Active</p>
                                <p className="text-xs opacity-90">
                                    Accuracy: {currentLocation.coords.accuracy.toFixed(0)}m
                                    {currentLocation.coords.speed && ` • Speed: ${(currentLocation.coords.speed * 3.6).toFixed(0)} km/h`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleStopTracking}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition"
                        >
                            Stop
                        </button>
                    </div>
                </div>
            )}

            <div className="p-4 space-y-6">
                {/* Active Orders List */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Active Orders ({activeOrders.length})
                    </h3>

                    {activeOrders.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl border border-gray-100 border-dashed">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">No active orders assigned.</p>
                            <p className="text-xs text-gray-400 mt-1">Wait for vendors to assign orders to you.</p>
                        </div>
                    ) : (
                        activeOrders.map((delivery) => {
                            const isCurrentlyTracking = trackingDeliveryId === delivery.id;

                            return (
                                <div key={delivery.id} className="card shadow-md border-indigo-50 mb-4">
                                    <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                                        <div>
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                                #{delivery.order.orderNumber}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(delivery.createdAt).toLocaleTimeString()} </p>
                                        </div>
                                        <span className="badge badge-warning text-sm font-semibold text-amber-600">
                                            {delivery.order.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Pickup */}
                                        <div className="flex gap-3">
                                            <div className="mt-1">
                                                <div className="w-2 h-2 bg-gray-300 rounded-full mb-1"></div>
                                                <div className="w-0.5 h-full bg-gray-200 mx-auto"></div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 uppercase">Pickup</p>
                                                <h4 className="font-semibold text-gray-900">{delivery.order.shop.name}</h4>
                                                <p className="text-sm text-gray-600 line-clamp-2">{delivery.order.shop.address}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <a href={`tel:${delivery.order.shop.phone}`} className="p-2 bg-gray-100 rounded-full self-center hover:bg-gray-200 transition">
                                                    <Phone className="w-5 h-5 text-gray-600" />
                                                </a>
                                                <button
                                                    onClick={() => openInGoogleMaps(
                                                        delivery.order.shop.latitude,
                                                        delivery.order.shop.longitude,
                                                        delivery.order.shop.name
                                                    )}
                                                    className="p-2 bg-blue-100 rounded-full self-center hover:bg-blue-200 transition"
                                                >
                                                    <Navigation2 className="w-5 h-5 text-blue-600" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Drop */}
                                        <div className="flex gap-3">
                                            <div className="mt-1">
                                                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 uppercase">Drop</p>
                                                <h4 className="font-semibold text-gray-900">{delivery.order.customer.name}</h4>
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {delivery.order.deliveryAddress.addressLine1}, {delivery.order.deliveryAddress.city}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <a href={`tel:${delivery.order.customer.phone}`} className="p-2 bg-gray-100 rounded-full self-center hover:bg-gray-200 transition">
                                                    <Phone className="w-5 h-5 text-gray-600" />
                                                </a>
                                                <button
                                                    onClick={() => openInGoogleMaps(
                                                        delivery.order.deliveryAddress.latitude,
                                                        delivery.order.deliveryAddress.longitude,
                                                        delivery.order.customer.name
                                                    )}
                                                    className="p-2 bg-blue-100 rounded-full self-center hover:bg-blue-200 transition"
                                                >
                                                    <Navigation2 className="w-5 h-5 text-blue-600" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <h5 className="text-sm font-medium mb-2">Order Items:</h5>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {delivery.order.orderItems.map((item: any, i: number) => (
                                                <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                                                    {item.quantity}x {item.product.name}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Embedded Map when Tracking is Active */}
                                        {isCurrentlyTracking && currentLocation && (
                                            <div className="mb-4 h-64 w-full rounded-xl overflow-hidden shadow-inner border border-gray-200">
                                                <DeliveryMap
                                                    deliveryPartnerLocation={{
                                                        lat: currentLocation.coords.latitude,
                                                        lng: currentLocation.coords.longitude
                                                    }}
                                                    shopLocation={{
                                                        lat: delivery.order.shop.latitude,
                                                        lng: delivery.order.shop.longitude
                                                    }}
                                                    customerLocation={{
                                                        lat: delivery.order.deliveryAddress.latitude,
                                                        lng: delivery.order.deliveryAddress.longitude
                                                    }}
                                                    // routePolyline={delivery.routePolyline} // If available
                                                    deliveryPartnerName="Me"
                                                    shopName={delivery.order.shop.name}
                                                    customerName={delivery.order.customer.name}
                                                />
                                            </div>
                                        )}

                                        {/* GPS Tracking Control */}
                                        {['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(delivery.order.status) && (
                                            <div className="mb-3">
                                                {isCurrentlyTracking ? (
                                                    <button
                                                        onClick={handleStopTracking}
                                                        className="w-full py-2.5 bg-red-100 text-red-700 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-red-200 transition"
                                                    >
                                                        <Radio className="w-5 h-5" />
                                                        Stop GPS Tracking
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleStartTracking(delivery.id)}
                                                        className="w-full py-2.5 bg-green-100 text-green-700 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-200 transition"
                                                    >
                                                        <MapPin className="w-5 h-5" />
                                                        Start GPS Tracking
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Buttons based on Status */}
                                        {delivery.order.status === 'ASSIGNED' && (
                                            <button
                                                onClick={() => handleUpdateOrder(delivery.order.id, 'EN_ROUTE_TO_PICKUP')}
                                                className="btn-primary flex items-center justify-center gap-2"
                                            >
                                                <Navigation className="w-5 h-5" /> Start Pickup
                                            </button>
                                        )}
                                        {delivery.order.status === 'EN_ROUTE_TO_PICKUP' && (
                                            <button
                                                onClick={() => handleUpdateOrder(delivery.order.id, 'PICKED_UP')}
                                                className="btn-primary bg-amber-600 hover:bg-amber-700 flex items-center justify-center gap-2"
                                            >
                                                <Package className="w-5 h-5" /> Confirm Pickup
                                            </button>
                                        )}
                                        {delivery.order.status === 'PICKED_UP' && (
                                            <button
                                                onClick={() => handleUpdateOrder(delivery.order.id, 'OUT_FOR_DELIVERY')}
                                                className="btn-primary bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                                            >
                                                <Navigation className="w-5 h-5" /> Out for Delivery
                                            </button>
                                        )}
                                        {delivery.order.status === 'OUT_FOR_DELIVERY' && (
                                            <button
                                                onClick={() => handleUpdateOrder(delivery.order.id, 'DELIVERED')}
                                                className="btn-primary bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle className="w-5 h-5" /> Mark Delivered
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <VerificationModal
                isOpen={showVerifyModal}
                onClose={() => {
                    setShowVerifyModal(false);
                    setVerifyingOrderId(null);
                }}
                onSubmit={handleVerifySubmit}
                isLoading={isVerifying}
            />
        </div>
    );
}
