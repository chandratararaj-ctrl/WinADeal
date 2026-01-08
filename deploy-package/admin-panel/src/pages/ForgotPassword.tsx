import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, Hash, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { requestOTP, resetPassword } from '../services/auth.service';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState<'REQUEST' | 'VERIFY' | 'SUCCESS'>('REQUEST');
    const [loading, setLoading] = useState(false);

    const [data, setData] = useState({
        phone: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.phone) {
            toast.error('Please enter your phone number');
            return;
        }

        try {
            setLoading(true);
            await requestOTP(data.phone);
            toast.success('OTP sent successfully!');
            setStep('VERIFY');
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to send OTP';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.otp || data.otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        if (data.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (data.newPassword !== data.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            await resetPassword({
                phone: data.phone,
                otp: data.otp,
                newPassword: data.newPassword
            });
            setStep('SUCCESS');
            toast.success('Password reset successfully!');
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to reset password';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Toaster position="top-right" />
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block">
                        <div className="bg-gradient-to-r from-red-600 to-red-800 text-white font-bold text-2xl px-6 py-3 rounded-lg mb-4 shadow-lg">
                            Admin Panel
                        </div>
                    </Link>
                    <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
                    {step === 'REQUEST' && <p className="text-gray-600 mt-2">Enter your phone number to receive OTP</p>}
                    {step === 'VERIFY' && <p className="text-gray-600 mt-2">Enter logic sent to {data.phone}</p>}
                </div>

                <div className="bg-white rounded-lg shadow-xl p-8">
                    {step === 'REQUEST' && (
                        <form onSubmit={handleRequestOTP} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="tel"
                                        placeholder="+91 99999 99999"
                                        value={data.phone}
                                        onChange={(e) => setData({ ...data, phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Sending...' : 'Send OTP'} <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    )}

                    {step === 'VERIFY' && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    OTP Code
                                </label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="123456"
                                        maxLength={6}
                                        value={data.otp}
                                        onChange={(e) => setData({ ...data, otp: e.target.value.replace(/\D/g, '') })}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-mono text-lg tracking-widest"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="password"
                                        placeholder="Min 6 characters"
                                        value={data.newPassword}
                                        onChange={(e) => setData({ ...data, newPassword: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="password"
                                        placeholder="Confirm new password"
                                        value={data.confirmPassword}
                                        onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Resetting...' : 'Reset Password'} <CheckCircle className="w-4 h-4" />
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('REQUEST')}
                                className="w-full text-gray-500 text-sm hover:text-gray-700"
                            >
                                Change Phone Number
                            </button>
                        </form>
                    )}

                    {step === 'SUCCESS' && (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h3>
                            <p className="text-gray-600 mb-6">Your password has been updated successfully. You can now login with your new password.</p>

                            <Link
                                to="/login"
                                className="inline-block w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                            >
                                Back to Login
                            </Link>
                        </div>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <Link to="/login" className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
