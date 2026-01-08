import React, { useState, useEffect } from 'react';
import {
    ShoppingBag,
    Search,
    Filter,
    Eye,
    MapPin,
    Phone,
    Clock,
    User,
    Truck,
    X,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import toast from '../utils/toast';
import { orderService } from '../services/order.service';
import { useSocketStore } from '../store/socketStore';
import soundService from '../services/soundNotification.service';

interface Order {
    id: string;
    orderNumber: string;
    customer: {
        name: string;
        phone: string;
    };
    shop: {
        name: string;
        address: string;
    };
    deliveryPartner?: {
        name?: string;
        phone?: string;
    } | null;
    items: number; // Mapped from orderItems length or calculated
    orderItems: {
        id: string;
        product: {
            name: string;
        };
        quantity: number;
        price: number;
    }[];
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    tax: number;
    total: number;
    deliveryAddress: {
        addressLine1: string;
        city: string;
        pincode: string;
    } | null;
    createdAt: string;
    estimatedDeliveryAt?: string;
}

const Orders: React.FC = () => {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Driver Assignment State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [driversLoading, setDriversLoading] = useState(false);

    const lastEvent = useSocketStore((state) => state.lastEvent);

    useEffect(() => {
        fetchOrders();

        // Poll every 15s to ensure data freshness
        const interval = setInterval(() => {
            fetchOrders(true);
        }, 15000);

        return () => clearInterval(interval);
    }, [statusFilter]);

    // Handle real-time updates with sound notifications
    useEffect(() => {
        if (lastEvent?.type === 'new_order') {
            // Play sound for new order
            soundService.playNewOrderSound();
            toast.order.newOrder(lastEvent.data?.orderNumber || 'New');
            fetchOrders(true);
        } else if (lastEvent?.type === 'order_update') {
            fetchOrders(true);
        }
    }, [lastEvent]);

    const fetchOrders = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const data = await orderService.getOrders({
                status: statusFilter,
            });
            setOrders((data.orders || []).map((o: any) => ({
                ...o,
                deliveryPartner: o.delivery?.deliveryPartner?.user ? {
                    name: o.delivery.deliveryPartner.user.name,
                    phone: o.delivery.deliveryPartner.user.phone
                } : null
            })));
        } catch (error) {
            console.error("Failed to fetch orders", error);
            if (!isBackground) toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            await orderService.updateStatus(orderId, newStatus);

            // Play appropriate sound based on status
            if (newStatus === 'ACCEPTED') {
                soundService.playOrderAcceptedSound();
                toast.order.orderAccepted(selectedOrder?.orderNumber || orderId);
            } else if (newStatus === 'READY') {
                soundService.playOrderCompletedSound();
                toast.order.orderReady(selectedOrder?.orderNumber || orderId);
            } else if (newStatus === 'CANCELLED') {
                soundService.playErrorSound();
                toast.order.orderCancelled(selectedOrder?.orderNumber || orderId);
            } else {
                toast.success(`Order marked as ${newStatus}`);
            }

            fetchOrders();
            if (selectedOrder?.id === orderId) {
                // Update local selected order status to reflect change immediately
                setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleOpenAssignModal = async () => {
        setShowAssignModal(true);
        setDriversLoading(true);
        try {
            const fetchedDrivers = await orderService.getDrivers();
            setDrivers(fetchedDrivers || []);
        } catch (error) {
            toast.error("Failed to load drivers");
        } finally {
            setDriversLoading(false);
        }
    };

    const handleAssignDriver = async (driverId: string) => {
        if (!selectedOrder) return;
        try {
            await orderService.assignDriver(selectedOrder.id, driverId);
            toast.success("Driver assigned successfully");
            setShowAssignModal(false);
            setShowModal(false);
            fetchOrders();
        } catch (error) {
            toast.error("Failed to assign driver");
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { class: string; text: string }> = {
            PLACED: { class: 'badge-info', text: 'Placed' },
            ACCEPTED: { class: 'badge-info', text: 'Accepted' },
            PREPARING: { class: 'badge-warning', text: 'Preparing' },
            READY: { class: 'badge-warning', text: 'Ready' },
            ASSIGNED: { class: 'badge-info', text: 'Assigned' },
            EN_ROUTE_TO_PICKUP: { class: 'badge-info', text: 'Picking Up' },
            PICKED_UP: { class: 'badge-info', text: 'Picked Up' },
            OUT_FOR_DELIVERY: { class: 'badge-warning', text: 'Out for Delivery' },
            DELIVERED: { class: 'badge-success', text: 'Delivered' },
            CANCELLED: { class: 'badge-danger', text: 'Cancelled' },
        };
        const badge = badges[status] || { class: 'badge-secondary', text: status };
        return <span className={`badge ${badge.class}`}>{badge.text}</span>;
    };

    const getPaymentBadge = (status: string) => {
        const badges: Record<string, { class: string; text: string }> = {
            PENDING: { class: 'badge-warning', text: 'Pending' },
            SUCCESS: { class: 'badge-success', text: 'Paid' },
            FAILED: { class: 'badge-danger', text: 'Failed' },
            REFUNDED: { class: 'badge-info', text: 'Refunded' },
        };
        const badge = badges[status] || { class: 'badge-secondary', text: status };
        return <span className={`badge ${badge.class}`}>{badge.text}</span>;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatAddress = (addr: any) => {
        if (!addr) return 'N/A';
        return `${addr.addressLine1}, ${addr.city}, ${addr.pincode}`;
    };

    const openOrderModal = (order: Order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer?.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
                    <p className="text-gray-600 mt-1">Track and manage all orders</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by order number or customer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input pl-10"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center space-x-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input"
                        >
                            <option value="all">All Status</option>
                            <option value="PLACED">Placed</option>
                            <option value="ACCEPTED">Accepted</option>
                            <option value="PREPARING">Preparing</option>
                            <option value="READY">Ready for Pickup</option>
                            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <ShoppingBag className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-4">
                        <div className="bg-amber-100 p-3 rounded-lg">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {orders.filter((o) => ['PLACED', 'ACCEPTED', 'PREPARING'].includes(o.status)).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-4">
                        <div className="bg-green-100 p-3 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Delivered</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {orders.filter((o) => o.status === 'DELIVERED').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-4">
                        <div className="bg-red-100 p-3 rounded-lg">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Cancelled</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {orders.filter((o) => o.status === 'CANCELLED').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order #</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Payment</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-6">Loading orders...</td>
                                </tr>
                            ) : filteredOrders.map((order) => (
                                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-4 px-4 text-sm font-medium text-gray-900">
                                        {order.orderNumber}
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-sm">
                                            <p className="font-medium text-gray-900">{order.customer?.name || "Guest"}</p>
                                            <p className="text-xs text-gray-500">{order.customer?.phone}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-sm font-medium text-gray-900">₹{order.total}</td>
                                    <td className="py-4 px-4">
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-600">{order.paymentMethod}</p>
                                            {getPaymentBadge(order.paymentStatus)}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">{getStatusBadge(order.status)}</td>
                                    <td className="py-4 px-4 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                                    <td className="py-4 px-4">
                                        <button
                                            onClick={() => openOrderModal(order)}
                                            className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>View</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {!loading && filteredOrders.length === 0 && (
                        <div className="text-center py-12">
                            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No orders found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Details Modal */}
            {showModal && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedOrder.orderNumber}</h2>
                                    <p className="text-sm text-gray-600 mt-1">{formatDate(selectedOrder.createdAt)}</p>
                                </div>
                                <div className='flex items-center gap-3'>
                                    {/* Quick Actions based on status */}
                                    {selectedOrder.status === 'PLACED' && (
                                        <>
                                            <button onClick={() => handleUpdateStatus(selectedOrder.id, 'ACCEPTED')} className="btn-primary flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" /> Accept
                                            </button>
                                            <button onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')} className="btn-danger flex items-center gap-2">
                                                <XCircle className="w-4 h-4" /> Reject
                                            </button>
                                        </>
                                    )}
                                    {selectedOrder.status === 'ACCEPTED' && (
                                        <button onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')} className="btn-primary flex items-center gap-2">
                                            <ShoppingBag className="w-4 h-4" /> Start Preparing
                                        </button>
                                    )}
                                    {selectedOrder.status === 'PREPARING' && (
                                        <button onClick={() => handleUpdateStatus(selectedOrder.id, 'READY')} className="btn-primary flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> Mark Ready
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-gray-400 hover:text-gray-600 ml-2"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Status</h3>
                                <div className="flex items-center space-x-4">
                                    {getStatusBadge(selectedOrder.status)}
                                    {getPaymentBadge(selectedOrder.paymentStatus)}
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Details</h3>
                                <div className="space-y-2">
                                    <p className="flex items-center text-sm">
                                        <User className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="font-medium">{selectedOrder.customer?.name}</span>
                                    </p>
                                    <p className="flex items-center text-sm">
                                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>{selectedOrder.customer?.phone}</span>
                                    </p>
                                    <p className="flex items-start text-sm">
                                        <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                                        <span>{formatAddress(selectedOrder.deliveryAddress)}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Delivery Partner */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Partner</h3>
                                {selectedOrder.deliveryPartner ? (
                                    <div className="space-y-2">
                                        <p className="flex items-center text-sm">
                                            <Truck className="w-4 h-4 mr-2 text-gray-400" />
                                            <span className="font-medium">{selectedOrder.deliveryPartner.name}</span>
                                        </p>
                                        <p className="flex items-center text-sm">
                                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                            <span>{selectedOrder.deliveryPartner.phone}</span>
                                        </p>
                                    </div>
                                ) : selectedOrder.status === 'READY' ? (
                                    <div className="flex flex-col gap-3">
                                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                                            <p className="text-sm text-amber-700 flex items-center gap-2">
                                                <Clock className="w-4 h-4" /> Waiting for delivery partner assignment...
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleOpenAssignModal}
                                            className="self-start text-sm bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                                        >
                                            Assign Driver Manually
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Not assigned yet</p>
                                )}
                            </div>

                            {/* Order Items */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
                                <div className="space-y-2">
                                    {selectedOrder.orderItems.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.product.name}</p>
                                                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="font-semibold text-gray-900">₹{item.price * item.quantity}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bill Summary */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill Summary</h3>
                                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">₹{selectedOrder.subtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Delivery Fee</span>
                                        <span className="font-medium">₹{selectedOrder.deliveryFee}</span>
                                    </div>
                                    {selectedOrder.discount > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Discount</span>
                                            <span className="font-medium">-₹{selectedOrder.discount}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tax</span>
                                        <span className="font-medium">₹{selectedOrder.tax}</span>
                                    </div>
                                    <div className="border-t border-gray-300 pt-2 mt-2">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-900">Total</span>
                                            <span className="font-bold text-lg text-gray-900">₹{selectedOrder.total}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Driver Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">Assign Delivery Partner</h3>
                            <button onClick={() => setShowAssignModal(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-4 max-h-96 overflow-y-auto">
                            {driversLoading ? (
                                <p className="text-center py-4">Loading drivers...</p>
                            ) : drivers.length === 0 ? (
                                <p className="text-center py-4 text-gray-500">No verified drivers available.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {drivers.map(driver => (
                                        <li key={driver.id} className="border p-3 rounded hover:bg-gray-50 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{driver.user?.name || 'Unknown Driver'}</p>
                                                <p className="text-xs text-gray-500">{driver.vehicleType} | {driver.user?.phone}</p>
                                            </div>
                                            <button
                                                onClick={() => handleAssignDriver(driver.id)}
                                                className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                                            >
                                                Assign
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
