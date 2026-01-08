import { useState, useEffect } from 'react';
import {
    Users,
    Store,
    Truck,
    DollarSign,
    TrendingUp,
    TrendingDown,
    ShoppingBag,
    MapPin,
    Clock,
    Award,
    Calendar,
    Activity,
    Package,
} from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    AreaChart,
    Area,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface PlatformMetrics {
    totalRevenue: number;
    totalOrders: number;
    activeVendors: number;
    activeCustomers: number;
    deliveryPartners: number;
    avgOrderValue: number;
    todayRevenue: number;
    todayOrders: number;
}

export default function EnhancedDashboard() {
    const [dateRange, setDateRange] = useState('7d');
    const [metrics, setMetrics] = useState<PlatformMetrics>({
        totalRevenue: 1250000,
        totalOrders: 1250,
        activeVendors: 45,
        activeCustomers: 890,
        deliveryPartners: 30,
        avgOrderValue: 450,
        todayRevenue: 125000,
        todayOrders: 87,
    });

    // Revenue trend data
    const revenueTrend = [
        { name: 'Mon', revenue: 12000, orders: 45 },
        { name: 'Tue', revenue: 15000, orders: 52 },
        { name: 'Wed', revenue: 13500, orders: 48 },
        { name: 'Thu', revenue: 18000, orders: 61 },
        { name: 'Fri', revenue: 16500, orders: 55 },
        { name: 'Sat', revenue: 22000, orders: 67 },
        { name: 'Sun', revenue: 19000, orders: 58 },
    ];

    // Order distribution by category
    const orderDistribution = [
        { name: 'Food', value: 450, color: '#3B82F6' },
        { name: 'Groceries', value: 320, color: '#10B981' },
        { name: 'Pharmacy', value: 180, color: '#F59E0B' },
        { name: 'Others', value: 300, color: '#8B5CF6' },
    ];

    // User growth data
    const userGrowth = [
        { month: 'Jan', customers: 120, vendors: 8 },
        { month: 'Feb', customers: 180, vendors: 12 },
        { month: 'Mar', customers: 250, vendors: 18 },
        { month: 'Apr', customers: 340, vendors: 25 },
        { month: 'May', customers: 480, vendors: 32 },
        { month: 'Jun', customers: 650, vendors: 38 },
        { month: 'Jul', customers: 890, vendors: 45 },
    ];

    // Peak hours data
    const peakHours = [
        { hour: '9 AM', orders: 15 },
        { hour: '12 PM', orders: 45 },
        { hour: '3 PM', orders: 28 },
        { hour: '6 PM', orders: 52 },
        { hour: '9 PM', orders: 38 },
    ];

    // Top vendors
    const topVendors = [
        { name: 'Pizza Paradise', orders: 156, revenue: 78000, rating: 4.8 },
        { name: 'Fresh Mart', orders: 142, revenue: 65000, rating: 4.7 },
        { name: 'Burger King', orders: 128, revenue: 58000, rating: 4.6 },
        { name: 'Sushi Bar', orders: 98, revenue: 52000, rating: 4.9 },
        { name: 'Green Grocers', orders: 87, revenue: 45000, rating: 4.5 },
    ];

    const kpiCards = [
        {
            title: "Today's Revenue",
            value: `₹${metrics.todayRevenue.toLocaleString()}`,
            change: 15.3,
            icon: <DollarSign className="w-6 h-6" />,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-100',
            textColor: 'text-green-600',
        },
        {
            title: "Today's Orders",
            value: metrics.todayOrders.toString(),
            change: 12.5,
            icon: <ShoppingBag className="w-6 h-6" />,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-600',
        },
        {
            title: 'Active Vendors',
            value: metrics.activeVendors.toString(),
            change: 8.2,
            icon: <Store className="w-6 h-6" />,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-600',
        },
        {
            title: 'Total Customers',
            value: metrics.activeCustomers.toString(),
            change: 18.7,
            icon: <Users className="w-6 h-6" />,
            color: 'from-amber-500 to-amber-600',
            bgColor: 'bg-amber-100',
            textColor: 'text-amber-600',
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-gray-600 mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="1y">Last Year</option>
                </select>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiCards.map((card, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${card.bgColor} p-3 rounded-lg`}>
                                    <div className={card.textColor}>{card.icon}</div>
                                </div>
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${card.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {card.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(card.change)}%
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue & Orders Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Revenue Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={revenueTrend}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                        Orders This Week
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 5 }} activeDot={{ r: 7 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Order Distribution & User Growth */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-600" />
                        Order Distribution by Category
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={orderDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {orderDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-600" />
                        User Growth
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={userGrowth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Legend />
                            <Bar dataKey="customers" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="vendors" fill="#10B981" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Peak Hours & Top Vendors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        Peak Hours
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={peakHours} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis type="number" stroke="#9ca3af" />
                            <YAxis dataKey="hour" type="category" stroke="#9ca3af" width={60} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="orders" fill="#6366F1" radius={[0, 8, 8, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-600" />
                        Top Performing Vendors
                    </h3>
                    <div className="space-y-3">
                        {topVendors.map((vendor, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                                            index === 1 ? 'bg-gray-400' :
                                                index === 2 ? 'bg-amber-600' :
                                                    'bg-gray-300'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{vendor.name}</p>
                                        <p className="text-xs text-gray-500">{vendor.orders} orders</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">₹{vendor.revenue.toLocaleString()}</p>
                                    <p className="text-xs text-yellow-600 flex items-center gap-1">
                                        ⭐ {vendor.rating}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Activity className="w-8 h-8 opacity-80" />
                        <span className="text-sm opacity-80">Platform</span>
                    </div>
                    <p className="text-3xl font-bold mb-1">₹{metrics.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm opacity-90">Total Revenue</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <ShoppingBag className="w-8 h-8 opacity-80" />
                        <span className="text-sm opacity-80">Orders</span>
                    </div>
                    <p className="text-3xl font-bold mb-1">{metrics.totalOrders.toLocaleString()}</p>
                    <p className="text-sm opacity-90">Total Orders</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <DollarSign className="w-8 h-8 opacity-80" />
                        <span className="text-sm opacity-80">Average</span>
                    </div>
                    <p className="text-3xl font-bold mb-1">₹{metrics.avgOrderValue}</p>
                    <p className="text-sm opacity-90">Avg Order Value</p>
                </div>
            </div>
        </div>
    );
}
