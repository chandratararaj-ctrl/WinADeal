import React, { useEffect, useState } from 'react';
import {
    ShoppingBag,
    Package,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Store,
    Clock,
    CheckCircle,
    AlertTriangle,
    Users,
    Star,
    Activity,
    Calendar,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuthStore } from '../store/authStore';
import { productService } from '../services/product.service';
import { getShopStats } from '../services/shop.service';
import { getCurrentUser } from '../services/auth.service';
import { useSocketStore } from '../store/socketStore';
import toast from 'react-hot-toast';

interface MetricCard {
    title: string;
    value: string;
    change: number;
    icon: React.ReactNode;
    color: string;
    trend?: 'up' | 'down';
}

interface DashboardStats {
    totalProducts: number;
    activeProducts: number;
    outOfStock: number;
    totalOrders: number;
    activeOrders: number;
    deliveredOrders: number;
    totalRevenue: number;
    todayRevenue: number;
    todayOrders: number;
    charts: any[];
    peakHours: { hour: string; orders: number }[];
    lowStockProducts: number;
    avgRating: number;
}

const Dashboard: React.FC = () => {
    const { user, updateUser } = useAuthStore();
    const shop = user?.shop;
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        activeProducts: 0,
        outOfStock: 0,
        totalOrders: 0,
        activeOrders: 0,
        deliveredOrders: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        todayOrders: 0,
        charts: [],
        peakHours: [],
        lowStockProducts: 0,
        avgRating: 0,
    });
    const [loading, setLoading] = useState(true);

    const lastEvent = useSocketStore((state) => state.lastEvent);

    // Refresh user data on mount
    useEffect(() => {
        const refreshUser = async () => {
            try {
                const userData = await getCurrentUser();
                updateUser(userData);
            } catch (error) {
                console.error("Failed to refresh user data", error);
            }
        };
        refreshUser();
    }, [updateUser]);

    const loadStats = async () => {
        if (shop?.id) {
            try {
                const shopStats = await getShopStats(shop.id);
                const productData = await productService.getShopProducts(shop.id, { limit: 1000 });
                const products = productData.products || [];

                setStats({
                    totalProducts: products.length,
                    activeProducts: products.filter((p: any) => p.isAvailable).length,
                    outOfStock: products.filter((p: any) => (p.stockQuantity || 0) === 0).length,
                    lowStockProducts: products.filter((p: any) => (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) <= 5).length,
                    totalOrders: shopStats.totalOrders,
                    activeOrders: shopStats.activeOrders,
                    deliveredOrders: shopStats.deliveredOrders,
                    totalRevenue: shopStats.totalRevenue,
                    todayRevenue: shopStats.todayRevenue || 0,
                    todayOrders: shopStats.todayOrders || 0,
                    charts: shopStats.charts || [],
                    peakHours: shopStats.peakHours || [],
                    avgRating: shop.rating || 0,
                });
            } catch (e) {
                console.error("Failed to load dashboard stats", e);
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        loadStats();
        // Auto-refresh every 30 seconds
        const interval = setInterval(() => loadStats(), 30000);
        return () => clearInterval(interval);
    }, [shop]);

    // Handle real-time updates
    useEffect(() => {
        if (lastEvent?.type === 'new_order' || lastEvent?.type === 'order_update') {
            loadStats();
        }
    }, [lastEvent]);

    const metrics: MetricCard[] = [
        {
            title: "Today's Revenue",
            value: `₹${stats.todayRevenue.toLocaleString()}`,
            change: 12.5,
            trend: 'up',
            icon: <DollarSign className="w-6 h-6" />,
            color: 'bg-gradient-to-br from-green-500 to-green-600',
        },
        {
            title: "Today's Orders",
            value: stats.todayOrders.toString(),
            change: 8.2,
            trend: 'up',
            icon: <ShoppingBag className="w-6 h-6" />,
            color: 'bg-gradient-to-br from-blue-500 to-blue-600',
        },
        {
            title: 'Active Orders',
            value: stats.activeOrders.toString(),
            change: 0,
            icon: <Activity className="w-6 h-6" />,
            color: 'bg-gradient-to-br from-purple-500 to-purple-600',
        },
        {
            title: 'Shop Rating',
            value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A',
            change: 0,
            icon: <Star className="w-6 h-6" />,
            color: 'bg-gradient-to-br from-amber-500 to-amber-600',
        },
    ];

    const chartData = stats.charts.length > 0 ? stats.charts : [
        { name: 'Mon', orders: 0, revenue: 0 },
        { name: 'Tue', orders: 0, revenue: 0 },
        { name: 'Wed', orders: 0, revenue: 0 },
        { name: 'Thu', orders: 0, revenue: 0 },
        { name: 'Fri', orders: 0, revenue: 0 },
        { name: 'Sat', orders: 0, revenue: 0 },
        { name: 'Sun', orders: 0, revenue: 0 },
    ];

    const inventoryData = [
        { name: 'In Stock', value: stats.activeProducts - stats.lowStockProducts, color: '#10B981' },
        { name: 'Low Stock', value: stats.lowStockProducts, color: '#F59E0B' },
        { name: 'Out of Stock', value: stats.outOfStock, color: '#EF4444' },
    ];

    const peakHoursData = stats.peakHours.length > 0 ? stats.peakHours : [
        { hour: '9 AM', orders: 0 },
        { hour: '12 PM', orders: 0 },
        { hour: '3 PM', orders: 0 },
        { hour: '6 PM', orders: 0 },
        { hour: '9 PM', orders: 0 },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-1 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    {/* Shop Status Toggle */}
                    {shop?.isVerified && (
                        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                            <Store className={`w-5 h-5 ${shop?.isOpen ? 'text-green-600' : 'text-gray-400'}`} />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-700">Shop Status</span>
                                <span className={`text-xs ${shop?.isOpen ? 'text-green-600' : 'text-gray-500'}`}>
                                    {shop?.isOpen ? 'Open for Orders' : 'Closed'}
                                </span>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        const { updateShop } = await import('../services/shop.service');
                                        await updateShop(shop.id, { isOpen: !shop.isOpen });
                                        const userData = await getCurrentUser();
                                        updateUser(userData);
                                        toast.success(shop.isOpen ? 'Shop closed' : 'Shop opened');
                                    } catch (error) {
                                        toast.error('Failed to update shop status');
                                    }
                                }}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${shop?.isOpen ? 'bg-green-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${shop?.isOpen ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    )}
                </div>

                {/* Verification Alert */}
                {!shop?.isVerified && (
                    <div className={`mt-4 border-l-4 p-4 ${shop?.rejectionReason ? 'bg-red-50 border-red-400' : 'bg-yellow-50 border-yellow-400'}`}>
                        <div className="flex">
                            <div className="flex-shrink-0">
                                {shop?.rejectionReason ? (
                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                ) : (
                                    <Clock className="h-5 w-5 text-yellow-400" />
                                )}
                            </div>
                            <div className="ml-3">
                                {shop?.rejectionReason ? (
                                    <div>
                                        <p className="text-sm font-medium text-red-800">
                                            Your shop verification was rejected.
                                        </p>
                                        <p className="mt-1 text-sm text-red-700">
                                            Reason: {shop.rejectionReason}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-yellow-700">
                                        Your shop is pending verification. Some features may be limited.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${metric.color} p-3 rounded-lg text-white shadow-lg`}>
                                    {metric.icon}
                                </div>
                                {metric.change !== 0 && (
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${metric.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {metric.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                        {Math.abs(metric.change)}%
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{metric.title}</p>
                            <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders Trend */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Orders This Week
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Line type="monotone" dataKey="orders" stroke="#4F46E5" strokeWidth={3} dot={{ fill: '#4F46E5', r: 5 }} activeDot={{ r: 7 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Revenue Trend */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Revenue This Week
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} />
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.3} />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Peak Hours */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-600" />
                        Peak Hours
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={peakHoursData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis type="number" stroke="#9ca3af" />
                            <YAxis dataKey="hour" type="category" stroke="#9ca3af" width={60} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="orders" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Inventory Status */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        Inventory Status
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={inventoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {inventoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        Quick Stats
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <Package className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Total Products</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">{stats.totalProducts}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Delivered</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">{stats.deliveredOrders}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-purple-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Total Revenue</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts Section */}
            {(stats.outOfStock > 0 || stats.lowStockProducts > 0) && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        Inventory Alerts
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stats.outOfStock > 0 && (
                            <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="bg-red-100 p-3 rounded-lg">
                                    <Package className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-red-900">Out of Stock</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.outOfStock} products</p>
                                    <p className="text-xs text-red-700 mt-1">Restock immediately</p>
                                </div>
                            </div>
                        )}
                        {stats.lowStockProducts > 0 && (
                            <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="bg-amber-100 p-3 rounded-lg">
                                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-amber-900">Low Stock</p>
                                    <p className="text-2xl font-bold text-amber-600">{stats.lowStockProducts} products</p>
                                    <p className="text-xs text-amber-700 mt-1">≤5 items remaining</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
