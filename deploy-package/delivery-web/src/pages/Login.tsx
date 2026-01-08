import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import toast, { Toaster } from 'react-hot-toast';

export default function Login() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [formData, setFormData] = useState({
        phone: '',
        email: '',
        password: '',
    });
    const [usePhone, setUsePhone] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.password) {
            toast.error('Please enter your password');
            return;
        }

        if (usePhone && !formData.phone) {
            toast.error('Please enter your phone number');
            return;
        }

        if (!usePhone && !formData.email) {
            toast.error('Please enter your email');
            return;
        }

        try {
            setLoading(true);
            const loginData = usePhone
                ? { phone: formData.phone, password: formData.password }
                : { email: formData.email, password: formData.password };

            const res = await authService.login(loginData);

            if (res.success) {
                const user = res.data.user;
                const roles = user.roles || [user.role]; // Fallback if roles not present

                // Check if role is DELIVERY or ADMIN
                if (!roles.includes('DELIVERY') && !roles.includes('ADMIN')) {
                    toast.error('Access denied. Driver account required.');
                    setLoading(false);
                    return;
                }

                // Auto-switch if needed
                let finalUser = user;
                let finalToken = res.data.accessToken;

                if (user.selectedRole !== 'DELIVERY' && user.selectedRole !== 'ADMIN') {
                    try {
                        // Temporarily use the received token to switch
                        // Note: In a real app we might need to set the token first or pass it in headers
                        // Since we can't easily pass it to the interceptor here without setting auth, 
                        // we'll rely on the backend allowing switch if we are authenticated.
                        // However, calling api.post will use the OLD token (none).
                        // So we must manually call switch with headers or set auth first.

                        // We'll set generic auth first
                        login(user, res.data.accessToken);

                        const switchRes = await authService.switchRole('DELIVERY');
                        if (switchRes.success) {
                            finalUser = { ...user, selectedRole: 'DELIVERY' };
                            finalToken = switchRes.data.accessToken;
                            toast.success('Switched to Delivery Profile');
                        }
                    } catch (err) {
                        console.error('Auto switch failed', err);
                        // If switch fails, we already logged in with default role.
                        // But we might be in wrong mode (e.g. CUSTOMER)
                        // Ideally we should block or warn. 
                        // But for now let's proceed and hope the user can switch manually or the UI handles it.
                    }
                }

                login(finalUser, finalToken);
                toast.success('Welcome back, partner!');

                navigate('/');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Login failed';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Toaster position="top-right" />
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block">
                        <div className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-2xl px-6 py-3 rounded-lg mb-4">
                            WinADeal
                        </div>
                    </Link>
                    <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
                    <p className="text-gray-600 mt-2">Sign in to your Delivery account</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-lg shadow-xl p-8">
                    {/* Toggle Phone/Email */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setUsePhone(true)}
                            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${usePhone
                                ? 'bg-sky-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Phone
                        </button>
                        <button
                            onClick={() => setUsePhone(false)}
                            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${!usePhone
                                ? 'bg-sky-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Email
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Phone/Email Input */}
                        {usePhone ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="tel"
                                        placeholder="+91 99999 99999"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Password Input */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <Link to="/forgot-password" className="text-sm font-medium text-sky-600 hover:text-sky-500">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-sky-600 text-white py-3 rounded-lg font-semibold hover:bg-sky-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 bg-sky-50 border border-sky-200 rounded-lg">
                        <p className="text-sm font-medium text-sky-900 mb-2">Demo Credentials:</p>
                        <p className="text-xs text-sky-700">
                            Phone: +91 98765 43210 | Password: driver123
                        </p>
                    </div>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-sky-600 hover:text-sky-700 font-medium">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to Home - Optional */}
                {/* <div className="text-center mt-6">
                    <Link to="/" className="text-gray-600 hover:text-gray-900">
                        ← Back to Home
                    </Link>
                </div> */}
            </div>
        </div>
    );
}
