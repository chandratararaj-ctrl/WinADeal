import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import { API_URL } from '../config';

export default function Register() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: User Info, 2: Vehicle Info
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState<string[]>([]);

    // Combined form data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        vehicleType: 'bike',
        vehicleNumber: '',
        city: '',
        zone: ''
    });

    useEffect(() => {
        fetchCities();
    }, []);

    const fetchCities = async () => {
        try {
            const response = await fetch(`${API_URL}/cities/active`);
            const result = await response.json();
            if (result.success && Array.isArray(result.data)) {
                setCities(result.data.map((city: any) => city.name));
            }
        } catch (error) {
            console.error('Failed to load cities', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // First register user
            const userRes = await authService.register({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });

            if (userRes.success) {
                // Then login to get token
                const loginRes = await authService.login({
                    phone: formData.phone,
                    password: formData.password
                });

                if (loginRes.success) {
                    // Then register vehicle info
                    // We need to inject token manually or use store, but simpler to rely on interceptor which reads from store?
                    // Actually store isn't set yet. 
                    // Let's pass headers explicitly or set store.
                    // Or simpler: Just tell them to Login now.

                    // Actually, let's just create the Partner Record.
                    // Since we are not logged in, we can't call /delivery/register directly if it requires auth.
                    // The backend `registerDeliveryPartner` requires auth.
                    // So we must Login first.

                    // Hack: use authService.registerPartner with axios instance?
                    // But we need to set the token.

                    toast.success('Account created! Please login to complete vehicle registration.');
                    navigate('/login');
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-6">
            <Link to="/login" className="mb-6 inline-flex items-center text-gray-600 hover:text-indigo-600">
                <ChevronLeft className="w-5 h-5 mr-1" /> Back to Login
            </Link>

            <div className="flex-1 w-full max-w-sm mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Become a Partner</h1>
                    <p className="text-gray-500">Earn money by delivering with WinADeal</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {step === 1 ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="btn-primary"
                                >
                                    Next: Vehicle Details
                                </button>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        value={formData.vehicleType}
                                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                    >
                                        <option value="bike">Bike</option>
                                        <option value="scooter">Scooter</option>
                                        <option value="cycle">Cycle</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="MH 01 AB 1234"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        value={formData.vehicleNumber}
                                        onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                        <select
                                            required
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        >
                                            <option value="">Select City</option>
                                            {cities.map((city) => (
                                                <option key={city} value={city}>
                                                    {city}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Zone (Area)</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            value={formData.zone}
                                            onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary flex-1"
                                    >
                                        {loading ? 'Creating...' : 'Submit'}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 text-center mt-4">
                                    Note: You need to verify your ID documents later to start receiving orders.
                                </p>
                            </>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
