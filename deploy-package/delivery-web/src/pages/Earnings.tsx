import { useEffect, useState } from 'react';
import { analyticsService, type DeliveryAnalytics } from '../services/analytics.service';
import {
    TrendingUp,
    DollarSign,
    Truck,
    Clock,
    Award,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Earnings() {
    const [analytics, setAnalytics] = useState<DeliveryAnalytics | null>(null);
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
            const data = await analyticsService.getDeliveryAnalytics(dateRange.startDate, dateRange.endDate);
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
                <LoadingSpinner size="lg" text="Loading earnings..." />
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
            label: 'Total Earnings',
            value: `₹${analytics.overview.totalEarnings.toLocaleString()}`,
            icon: DollarSign,
            color: 'bg-green-500',
            change: '+15%'
        },
        {
            label: 'Total Deliveries',
            value: analytics.overview.totalDeliveries,
            icon: Truck,
            color: 'bg-blue-500',
            change: '+12%'
        },
        {
            label: 'Completed',
            value: analytics.overview.completedDeliveries,
            icon: Award,
            color: 'bg-purple-500',
            change: '+10%'
        },
        {
            label: 'On-Time Rate',
            value: `${analytics.overview.onTimePercentage}%`,
            icon: Clock,
            color: 'bg-indigo-500',
            change: '+5%'
        },
        {
            label: 'Avg Delivery Time',
            value: `${analytics.overview.avgDeliveryTime} min`,
            icon: TrendingUp,
            color: 'bg-orange-500',
            change: '-3%'
        }
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Earnings & Analytics</h1>
                    <p className="text-gray-600 mt-1">Track your performance and earnings</p>
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

            {/* Earnings Trend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Daily Earnings</h2>
                    <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <div className="space-y-4">
                    {analytics.dailyEarnings.slice(-7).map((day, index) => {
                        const maxEarnings = Math.max(...analytics.dailyEarnings.map(d => d.earnings));
                        const percentage = maxEarnings > 0 ? (day.earnings / maxEarnings) * 100 : 0;

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
                                        <span className="text-gray-600">{day.deliveries} deliveries</span>
                                        <span className="font-bold text-gray-900">₹{day.earnings.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Completion Rate */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                            <span className="text-sm font-bold text-gray-900">
                                {analytics.overview.totalDeliveries > 0
                                    ? Math.round((analytics.overview.completedDeliveries / analytics.overview.totalDeliveries) * 100)
                                    : 0}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full"
                                style={{
                                    width: `${analytics.overview.totalDeliveries > 0
                                        ? (analytics.overview.completedDeliveries / analytics.overview.totalDeliveries) * 100
                                        : 0}%`
                                }}
                            />
                        </div>
                    </div>

                    {/* On-Time Delivery */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">On-Time Delivery</span>
                            <span className="text-sm font-bold text-gray-900">{analytics.overview.onTimePercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-green-500 to-teal-500 h-full rounded-full"
                                style={{ width: `${analytics.overview.onTimePercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Earnings Breakdown */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm text-green-600 font-medium">Total Earned</p>
                            <p className="text-2xl font-bold text-green-700 mt-1">
                                ₹{analytics.overview.totalEarnings.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-600 font-medium">Avg per Delivery</p>
                            <p className="text-2xl font-bold text-blue-700 mt-1">
                                ₹{analytics.overview.completedDeliveries > 0
                                    ? Math.round(analytics.overview.totalEarnings / analytics.overview.completedDeliveries)
                                    : 0}
                            </p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-sm text-purple-600 font-medium">Deliveries</p>
                            <p className="text-2xl font-bold text-purple-700 mt-1">
                                {analytics.overview.completedDeliveries}
                            </p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <p className="text-sm text-orange-600 font-medium">Avg Time</p>
                            <p className="text-2xl font-bold text-orange-700 mt-1">
                                {analytics.overview.avgDeliveryTime}m
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
