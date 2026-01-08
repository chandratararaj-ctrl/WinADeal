import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingBag,
    Store,
    Package,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    Search,
    BarChart3,
    Star,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getCurrentUser } from '../services/auth.service';
import toast from 'react-hot-toast';

interface NavItem {
    name: string;
    path: string;
    icon: React.ReactNode;
}

const DashboardLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, clearAuth, updateUser, isAuthenticated } = useAuthStore();

    useEffect(() => {
        const refreshUserData = async () => {
            if (isAuthenticated) {
                try {
                    const freshUser = await getCurrentUser();
                    updateUser(freshUser);

                    if (!freshUser.shop && location.pathname !== '/create-shop') {
                        navigate('/create-shop');
                    }
                } catch (error) {
                    console.error('Failed to refresh user data', error);
                }
            }
        };

        refreshUserData();
    }, [isAuthenticated, updateUser, navigate, location.pathname]);

    const navItems: NavItem[] = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
        { name: 'My Products', path: '/products', icon: <Package className="w-5 h-5" /> },
        { name: 'Incoming Orders', path: '/orders', icon: <ShoppingBag className="w-5 h-5" /> },
        { name: 'Analytics', path: '/analytics', icon: <BarChart3 className="w-5 h-5" /> },
        { name: 'Reviews', path: '/reviews', icon: <Star className="w-5 h-5" /> },
        { name: 'Shop Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
    ];

    const handleLogout = () => {
        clearAuth();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 h-screen transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } bg-white border-r border-gray-200 w-64`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <Store className="w-8 h-8 text-primary-600" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">Vendor Panel</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary-50 text-primary-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 font-semibold text-sm">
                                {user?.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`${sidebarOpen ? 'lg:ml-64' : ''} transition-all duration-300`}>
                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between h-16 px-6">
                        {/* Left: Menu Button */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Center: Search */}
                        <div className="flex-1 max-w-2xl mx-8">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search orders, vendors, customers..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        {/* Right: Notifications & Profile */}
                        <div className="flex items-center space-x-4">
                            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                                <Bell className="w-6 h-6" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default DashboardLayout;
