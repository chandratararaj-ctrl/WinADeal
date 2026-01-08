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
    Store,
    Truck,
    X,
    CheckCircle,
    XCircle,
    Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { orderService } from '../services/order.service';
import { useSocketStore } from '../store/socketStore';

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
        name: string;
        phone: string;
    };
    items: {
        name: string;
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
    deliveryAddress: string;
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

    const lastEvent = useSocketStore((state) => state.lastEvent);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await orderService.getOrders({
                status: statusFilter === 'all' ? undefined : statusFilter
            });
            setOrders((data.orders || []).map((o: any) => ({
                ...o,
                items: (o.orderItems || []).map((item: any) => ({
                    name: item.product?.name || 'Unnamed Product',
                    quantity: item.quantity,
                    price: item.price
                })),
                deliveryAddress: o.deliveryAddress ? `${o.deliveryAddress.addressLine1}, ${o.deliveryAddress.city}` : 'N/A'
            })));
        } catch (error) {
            console.error("Failed to fetch orders", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const toastId = toast.loading('Exporting orders...');
            // Fetch all orders for export (limit 1000)
            const data = await orderService.getOrders({ limit: 1000, status: statusFilter === 'all' ? undefined : statusFilter });
            const ordersToExport = data.orders || [];

            if (ordersToExport.length === 0) {
                toast.dismiss(toastId);
                toast.error('No orders to export');
                return;
            }

            // Define CSV headers
            const headers = ['Order Number', 'Date', 'Customer Name', 'Customer Phone', 'Shop', 'Status', 'Total', 'Payment Status'];

            // Convert to CSV
            const csvContent = [
                headers.join(','),
                ...ordersToExport.map((o: any) => [
                    o.orderNumber,
                    new Date(o.createdAt).toISOString().split('T')[0],
                    `"${o.customer.name}"`,
                    o.customer.phone,
                    `"${o.shop.name}"`,
                    o.status,
                    o.total,
                    o.paymentStatus
                ].join(','))
            ].join('\n');

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.dismiss(toastId);
            toast.success('Orders exported successfully');
        } catch (error) {
            console.error('Export failed', error);
            toast.error('Failed to export orders');
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    useEffect(() => {
        if (lastEvent?.type === 'new_order' || lastEvent?.type === 'order_update') {
            fetchOrders();
        }
    }, [lastEvent]);

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
        const badge = badges[status] || badges.PLACED;
        return <span className={`badge ${badge.class}`}>{badge.text}</span>;
    };

    const getPaymentBadge = (status: string) => {
        const badges: Record<string, { class: string; text: string }> = {
            PENDING: { class: 'badge-warning', text: 'Pending' },
            SUCCESS: { class: 'badge-success', text: 'Paid' },
            FAILED: { class: 'badge-danger', text: 'Failed' },
            REFUNDED: { class: 'badge-info', text: 'Refunded' },
        };
        const badge = badges[status] || badges.PENDING;
        return <span className={`badge ${badge.class}`}>{badge.text}</span>;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const openOrderModal = (order: Order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    const filteredOrders = orders.filter((order) => {
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const matchesSearch =
            order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.shop.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
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
                                placeholder="Search by order number, customer, or shop..."
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
                            <option value="PREPARING">Preparing</option>
                            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </button>
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
                            <p className="text-sm text-gray-600">Active</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length}
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
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Shop</th>
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
                                    <td colSpan={8} className="text-center py-10">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                                            <span>Loading orders...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.map((order) => (
                                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-4 px-4 text-sm font-medium text-gray-900">
                                        {order.orderNumber}
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-sm">
                                            <p className="font-medium text-gray-900">{order.customer.name}</p>
                                            <p className="text-xs text-gray-500">{order.customer.phone}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-sm text-gray-700">{order.shop.name}</td>
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

                    {filteredOrders.length === 0 && (
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
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
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
                                        <span className="font-medium">{selectedOrder.customer.name}</span>
                                    </p>
                                    <p className="flex items-center text-sm">
                                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>{selectedOrder.customer.phone}</span>
                                    </p>
                                    <p className="flex items-start text-sm">
                                        <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                                        <span>{selectedOrder.deliveryAddress}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Shop Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Shop Details</h3>
                                <div className="space-y-2">
                                    <p className="flex items-center text-sm">
                                        <Store className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="font-medium">{selectedOrder.shop.name}</span>
                                    </p>
                                    <p className="flex items-start text-sm">
                                        <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                                        <span>{selectedOrder.shop.address}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Delivery Partner */}
                            {selectedOrder.deliveryPartner && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Partner</h3>
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
                                </div>
                            )}

                            {/* Order Items */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.name}</p>
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
        </div>
    );
};

export default Orders;
