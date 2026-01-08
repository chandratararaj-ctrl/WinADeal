import { useEffect, useState } from 'react';
import { analyticsService, type VendorAnalytics } from '../services/analytics.service';
import {
    TrendingUp,
    ShoppingBag,
    DollarSign,
    Package,
    AlertTriangle,
    Clock,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from '../utils/toast';

export default function VendorAnalytics() {
    const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const data = await analyticsService.getVendorAnalytics(dateRange.startDate, dateRange.endDate);
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" text="Loading analytics..." />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">No analytics data available</p>
            </div>
        );
    }

    const stats = [
        {
            label: 'Total Orders',
            value: analytics.overview.totalOrders,
            icon: ShoppingBag,
            color: 'bg-blue-500',
            change: '+12%'
        },
        {
            label: 'Total Revenue',
            value: `₹${analytics.overview.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'bg-green-500',
            change: '+15%'
        },
        {
            label: 'Avg Order Value',
            value: `₹${Math.round(analytics.overview.avgOrderValue)}`,
            icon: TrendingUp,
            color: 'bg-purple-500',
            change: '+8%'
        },
        {
            label: 'Total Products',
            value: analytics.overview.totalProducts,
            icon: Package,
            color: 'bg-indigo-500',
            change: '+5%'
        },
        {
            label: 'Active Products',
            value: analytics.overview.activeProducts,
            icon: Package,
            color: 'bg-teal-500',
            change: '+3%'
        },
        {
            label: 'Low Stock Items',
            value: analytics.overview.lowStockProducts,
            icon: AlertTriangle,
            color: 'bg-orange-500',
            change: '-2%'
        }
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Shop Analytics</h1>
                    <p className="text-gray-600 mt-1">Performance insights and trends</p>
                </div>

                {/* Date Range Selector */}
                <div className="flex items-center gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                                <div className="flex items-center gap-1 mt-2">
                                    {stat.change.startsWith('+') ? (
                                        <ArrowUp className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <ArrowDown className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                        {stat.change}
                                    </span>
                                    <span className="text-sm text-gray-500">vs last period</span>
                                </div>
                            </div>
                            <div className={`${stat.color} p-4 rounded-xl`}>
                                <stat.icon className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Trend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Revenue Trend</h2>
                    <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div className="space-y-4">
                    {analytics.dailyRevenue.slice(-7).map((day, index) => {
                        const maxRevenue = Math.max(...analytics.dailyRevenue.map(d => d.revenue));
                        const percentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;

                        return (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-gray-700">
                                        {new Date(day.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-600">{day.orders} orders</span>
                                        <span className="font-bold text-gray-900">₹{day.revenue.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Top Selling Products</h2>
                    <div className="space-y-4">
                        {analytics.topProducts.slice(0, 5).map((product, index) => (
                            <div key={product.productId} className="flex items-center gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">{product.productName}</p>
                                    <p className="text-sm text-gray-600">{product.quantity} sold</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">₹{product.revenue.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Peak Hours */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Clock className="w-6 h-6 text-indigo-500" />
                        <h2 className="text-xl font-bold text-gray-900">Peak Hours</h2>
                    </div>
                    <div className="space-y-4">
                        {analytics.peakHours.map((hour, index) => {
                            const maxOrders = Math.max(...analytics.peakHours.map(h => h.orders));
                            const percentage = (hour.orders / maxOrders) * 100;
                            const hourLabel = hour.hour === 0 ? '12 AM' :
                                hour.hour < 12 ? `${hour.hour} AM` :
                                    hour.hour === 12 ? '12 PM' :
                                        `${hour.hour - 12} PM`;

                            return (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-gray-700">{hourLabel}</span>
                                        <span className="font-bold text-gray-900">{hour.orders} orders</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Order Status Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Status Distribution</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analytics.ordersByStatus.map((status) => {
                        const statusColors: Record<string, string> = {
                            PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                            CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
                            PREPARING: 'bg-purple-100 text-purple-800 border-purple-300',
                            READY: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                            PICKED_UP: 'bg-orange-100 text-orange-800 border-orange-300',
                            DELIVERED: 'bg-green-100 text-green-800 border-green-300',
                            CANCELLED: 'bg-red-100 text-red-800 border-red-300'
                        };

                        return (
                            <div
                                key={status.status}
                                className={`p-4 rounded-lg border-2 ${statusColors[status.status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
                            >
                                <p className="text-sm font-medium opacity-80">{status.status.replace('_', ' ')}</p>
                                <p className="text-3xl font-bold mt-2">{status.count}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
