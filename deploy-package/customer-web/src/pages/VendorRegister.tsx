import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Store, MapPin, FileText } from 'lucide-react';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

export default function VendorRegister() {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);
    const [formData, setFormData] = useState({
        // Personal Info
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',

        // Shop Info
        shopName: '',
        shopDescription: '',
        categoryId: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',

        // Business Info
        gstNumber: '',
        fssaiNumber: '',
        bankAccountNumber: '',
        ifscCode: '',
    });
    const [loading, setLoading] = useState(false);

    const categories = [
        { id: 'food', name: 'Food & Restaurant' },
        { id: 'grocery', name: 'Grocery' },
        { id: 'pharmacy', name: 'Pharmacy' },
        { id: 'bakery', name: 'Bakery' },
        { id: 'other', name: 'Other' },
    ];

    const handleNext = () => {
        // Validate step 1
        if (!formData.name || !formData.phone || !formData.password) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate step 2
        if (!formData.shopName || !formData.categoryId || !formData.addressLine1 || !formData.city || !formData.state || !formData.pincode) {
            toast.error('Please fill in all required shop details');
            return;
        }

        try {
            setLoading(true);

            // Register as vendor
            const res = await authService.register({
                name: formData.name,
                phone: formData.phone,
                email: formData.email || undefined,
                password: formData.password,
                role: 'VENDOR',
            });

            if (res.success) {
                toast.success('Registration successful! Your shop will be verified by admin.');
                navigate('/login');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block">
                        <div className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-2xl px-6 py-3 rounded-lg mb-4">
                            WinADeal
                        </div>
                    </Link>
                    <h2 className="text-3xl font-bold text-gray-900">Partner with Us</h2>
                    <p className="text-gray-600 mt-2">Register your shop and start selling</p>
                </div>

                {/* Progress Steps */}
                <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
                    <div className="flex items-center justify-center space-x-4 mb-8">
                        <div className={`flex items-center ${step >= 1 ? 'text-sky-600' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-sky-600 text-white' : 'bg-gray-200'
                                }`}>
                                1
                            </div>
                            <span className="ml-2 font-medium hidden sm:inline">Personal Info</span>
                        </div>
                        <div className="w-16 h-1 bg-gray-200">
                            <div className={`h-full ${step >= 2 ? 'bg-sky-600' : ''}`}></div>
                        </div>
                        <div className={`flex items-center ${step >= 2 ? 'text-sky-600' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-sky-600 text-white' : 'bg-gray-200'
                                }`}>
                                2
                            </div>
                            <span className="ml-2 font-medium hidden sm:inline">Shop Details</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Personal Information */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number *
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="tel"
                                            placeholder="+91 99999 99999"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password *
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="password"
                                            placeholder="Minimum 6 characters"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm Password *
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="password"
                                            placeholder="Re-enter password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="w-full bg-sky-600 text-white py-3 rounded-lg font-semibold hover:bg-sky-700 transition-colors"
                                >
                                    Next: Shop Details
                                </button>
                            </div>
                        )}

                        {/* Step 2: Shop Details */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Shop Details</h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Shop Name *
                                    </label>
                                    <div className="relative">
                                        <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="My Amazing Shop"
                                            value={formData.shopName}
                                            onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Shop Description
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                        <textarea
                                            placeholder="Tell us about your shop..."
                                            value={formData.shopDescription}
                                            onChange={(e) => setFormData({ ...formData, shopDescription: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Select category</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address Line 1 *
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Street address"
                                            value={formData.addressLine1}
                                            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address Line 2
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Apartment, suite, etc."
                                        value={formData.addressLine2}
                                        onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            City *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Mumbai"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Maharashtra"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Pincode *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="400001"
                                        value={formData.pincode}
                                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div className="border-t border-gray-200 pt-4 mt-6">
                                    <h4 className="font-semibold text-gray-900 mb-4">Business Information (Optional)</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                GST Number
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="22AAAAA0000A1Z5"
                                                value={formData.gstNumber}
                                                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                FSSAI Number
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="12345678901234"
                                                value={formData.fssaiNumber}
                                                onChange={(e) => setFormData({ ...formData, fssaiNumber: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-sky-600 text-white py-3 rounded-lg font-semibold hover:bg-sky-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Submitting...' : 'Submit for Verification'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Login Link */}
                <div className="text-center">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-sky-600 hover:text-sky-700 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-4">
                    <Link to="/" className="text-gray-600 hover:text-gray-900">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
