import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, Check, Truck, Package, Clock, Timer } from 'lucide-react';
import { orderService } from '../services/order.service';
import { trackingService, type DeliveryTracking } from '../services/tracking.service';
import { useSocketStore } from '../store/socketStore';
import DeliveryMap from '../components/DeliveryMap';
import toast from 'react-hot-toast';

export default function TrackOrder() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [trackingData, setTrackingData] = useState<DeliveryTracking | null>(null);
    const [loading, setLoading] = useState(true);
    const lastEvent = useSocketStore((state) => state.lastEvent);

    useEffect(() => {
        if (id) {
            fetchOrder(id);
            // Poll for updates every 10 seconds
            const interval = setInterval(() => {
                fetchOrder(id, true);
                if (order?.delivery?.id) {
                    fetchTracking(order.delivery.id, true);
                }
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [id]);

    useEffect(() => {
        // Refresh on socket update
        if (lastEvent?.type === 'order_update' && lastEvent.payload?.orderId === id) {
            fetchOrder(id!, true);
        }
        if (lastEvent?.type === 'location:update' && order?.delivery?.id === lastEvent.payload?.deliveryId) {
            fetchTracking(order.delivery.id, true);
        }
    }, [lastEvent, id, order]);

    const fetchOrder = async (orderId: string, isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const response = await orderService.getOrderById(orderId);
            const orderData = response.data || response;
            setOrder(orderData);

            // Fetch tracking data if delivery exists
            if (orderData?.delivery?.id) {
                await fetchTracking(orderData.delivery.id, isBackground);
            }
        } catch (error) {
            console.error(error);
            if (!isBackground) {
                toast.error('Failed to load order details');
            }
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const fetchTracking = async (deliveryId: string, isBackground = false) => {
        try {
            const tracking = await trackingService.getDeliveryLocation(deliveryId);
            setTrackingData(tracking);
        } catch (error) {
            console.error('Tracking error:', error);
            if (!isBackground) {
                // optional: toast.error('Failed to update tracking');
            }
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading tracking info...</p>
            </div>
        </div>
    );

    if (!order) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Order not found</p>
            </div>
        </div>
    );

    const steps = [
        { status: 'PLACED', label: 'Order Placed', icon: Clock },
        { status: 'CONFIRMED', label: 'Confirmed', icon: Check },
        { status: 'PREPARING', label: 'Preparing', icon: Package },
        { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
        { status: 'DELIVERED', label: 'Delivered', icon: MapPin },
    ];

    const getStepStatus = (currentStatus: string) => {
        if (currentStatus === 'PENDING') return 0;
        if (['ACCEPTED', 'CONFIRMED'].includes(currentStatus)) return 1;
        if (['READY', 'ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'PICKED_UP'].includes(currentStatus)) return 2;
        if (currentStatus === 'OUT_FOR_DELIVERY') return 3;
        if (currentStatus === 'DELIVERED') return 4;
        if (['CANCELLED', 'REJECTED'].includes(currentStatus)) return -1;
        return 0;
    };

    const currentStepIndex = getStepStatus(order.status);
    const isCancelled = ['CANCELLED', 'REJECTED'].includes(order.status);
    const isTracking = trackingData?.delivery?.isTracking || false;
    const hasDelivery = order.delivery && order.shop && order.deliveryAddress;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10 flex items-center gap-4">
                <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-lg font-bold">Track Order #{order.orderNumber}</h1>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">

                {/* ETA Card (if tracking active) */}
                {isTracking && trackingData?.delivery?.etaMinutes && (
                    <div className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Timer className="w-8 h-8" />
                                <div>
                                    <p className="text-sm opacity-90">Estimated Arrival</p>
                                    <p className="text-3xl font-bold">{trackingData.delivery.etaMinutes} min</p>
                                </div>
                            </div>
                            {trackingData?.delivery?.distanceKm && (
                                <div className="text-right">
                                    <p className="text-sm opacity-90">Distance</p>
                                    <p className="text-2xl font-bold">{trackingData.delivery.distanceKm.toFixed(1)} km</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Live Map */}
                {!isCancelled && hasDelivery && (
                    <div className="h-96 w-full rounded-xl overflow-hidden shadow-sm border border-gray-100">
                        <DeliveryMap
                            deliveryPartnerLocation={trackingData?.delivery?.currentLocation ? {
                                lat: trackingData.delivery.currentLocation.latitude,
                                lng: trackingData.delivery.currentLocation.longitude
                            } : undefined}
                            shopLocation={{
                                lat: order.shop.latitude,
                                lng: order.shop.longitude
                            }}
                            customerLocation={{
                                lat: order.deliveryAddress.latitude,
                                lng: order.deliveryAddress.longitude
                            }}
                            routePolyline={trackingData?.delivery?.routePolyline || undefined}
                            deliveryPartnerName={order.delivery?.deliveryPartner?.user?.name}
                            shopName={order.shop.name}
                            customerName={order.deliveryAddress.name || 'Customer'}
                        />
                    </div>
                )}

                {/* Delivery Partner Info */}
                {order.delivery?.deliveryPartner?.user && (
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Delivery Partner</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                                <span className="text-white font-bold text-2xl">
                                    {order.delivery.deliveryPartner.user.name.charAt(0)}
                                </span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-lg">{order.delivery.deliveryPartner.user.name}</h4>
                                <p className="text-sm text-gray-500">
                                    {order.delivery.deliveryPartner.vehicleType} • ⭐ {order.delivery.deliveryPartner.rating?.toFixed(1) || 'N/A'}
                                </p>
                            </div>
                            <a
                                href={`tel:${order.delivery.deliveryPartner.user.phone}`}
                                className="p-3 bg-green-100 rounded-full text-green-700 hover:bg-green-200 transition"
                            >
                                <Phone className="w-5 h-5" />
                            </a>
                        </div>

                        {/* Last Location Update */}
                        {trackingData?.delivery?.currentLocation?.lastUpdate && (
                            <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                                Last updated: {new Date(trackingData.delivery.currentLocation.lastUpdate).toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                )}

                {/* Status Timeline */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6">Order Status</h3>
                    {isCancelled ? (
                        <div className="text-center text-red-600 py-8">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">❌</span>
                            </div>
                            <h2 className="text-xl font-bold">Order Cancelled</h2>
                            <p className="text-gray-500 mt-2">This order has been cancelled.</p>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                            <div className="space-y-8 relative">
                                {steps.map((step, index) => {
                                    const isCompleted = index <= currentStepIndex;
                                    const isCurrent = index === currentStepIndex;
                                    const Icon = step.icon;

                                    return (
                                        <div key={index} className="flex items-center gap-4">
                                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                                                ${isCompleted ? 'bg-sky-600 border-sky-600 text-white scale-110' : 'bg-white border-gray-300 text-gray-400'}
                                                ${isCurrent ? 'ring-4 ring-sky-100 shadow-lg' : ''}
                                            `}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {step.label}
                                                </h3>
                                                {isCurrent && (
                                                    <p className="text-xs text-sky-600 font-medium flex items-center gap-1 mt-1">
                                                        <span className="w-1.5 h-1.5 bg-sky-600 rounded-full animate-pulse"></span>
                                                        In Progress
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Order Details */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">Order Details</h3>
                    <div className="space-y-2">
                        {order.orderItems.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-600">{item.quantity}x {item.product.name}</span>
                                <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="text-sky-600">₹{order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
