import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Lock, LogOut, Plus, Trash2, Home, Briefcase, Map } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { addressService } from '../services/order.service';

interface Address {
    id: string;
    label: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
}

export default function Profile() {
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security'>('profile');

    // Address State
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: 'Home',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (activeTab === 'addresses') {
            fetchAddresses();
        }
    }, [activeTab]);

    const fetchAddresses = async () => {
        try {
            const res = await addressService.getMyAddresses();
            const data = Array.isArray(res) ? res : (res.data || []);
            setAddresses(data);
        } catch (error: any) {
            console.error('Failed to fetch addresses:', error);
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                // navigate('/login'); // Let the user act or interceptor handle it
            } else {
                toast.error('Failed to fetch addresses');
            }
        }
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addressService.createAddress(newAddress);
            toast.success('Address added successfully');
            setShowAddressModal(false);
            setNewAddress({
                label: 'Home',
                addressLine1: '',
                addressLine2: '',
                city: '',
                state: '',
                pincode: '',
                isDefault: false
            });
            fetchAddresses();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add address');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!confirm('Are you sure you want to delete this address?')) return;
        try {
            await addressService.deleteAddress(id);
            toast.success('Address deleted');
            fetchAddresses();
        } catch (error) {
            toast.error('Failed to delete address');
        }
    };

    const handleLogout = () => {
        clearAuth();
        toast.success('Logged out successfully');
        navigate('/');
    };

    if (!user) {
        return null; // Navigation is handled in useEffect
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="text-center mb-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl text-white font-bold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-900">{user.name}</h3>
                                <p className="text-sm text-gray-600">{user.phone}</p>
                            </div>

                            <nav className="space-y-2">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'profile'
                                        ? 'bg-sky-50 text-sky-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <User className="w-5 h-5" />
                                    <span>Profile Info</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('addresses')}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'addresses'
                                        ? 'bg-sky-50 text-sky-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <MapPin className="w-5 h-5" />
                                    <span>Addresses</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('security')}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'security'
                                        ? 'bg-sky-50 text-sky-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Lock className="w-5 h-5" />
                                    <span>Security</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Logout</span>
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {activeTab === 'profile' && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                value={user.name}
                                                readOnly
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="tel"
                                                value={user.phone}
                                                readOnly
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                                            />
                                        </div>
                                    </div>

                                    {user.email && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                <input
                                                    type="email"
                                                    value={user.email}
                                                    readOnly
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'addresses' && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Saved Addresses</h2>
                                    <button
                                        onClick={() => setShowAddressModal(true)}
                                        className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors flex items-center"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Add New Address
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {addresses.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No addresses saved yet.</p>
                                    ) : (
                                        addresses.map(addr => (
                                            <div key={addr.id} className="border-2 border-gray-200 rounded-lg p-4 relative group">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center">
                                                        {addr.label.toLowerCase() === 'home' && <Home className="w-4 h-4 mr-2 text-sky-600" />}
                                                        {addr.label.toLowerCase() === 'work' && <Briefcase className="w-4 h-4 mr-2 text-indigo-600" />}
                                                        {addr.label.toLowerCase() !== 'home' && addr.label.toLowerCase() !== 'work' && <Map className="w-4 h-4 mr-2 text-gray-600" />}

                                                        <span className="font-semibold text-gray-900">{addr.label}</span>
                                                        {addr.isDefault && (
                                                            <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteAddress(addr.id)}
                                                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className="text-gray-600 text-sm mb-1">{addr.addressLine1}</p>
                                                {addr.addressLine2 && <p className="text-gray-600 text-sm mb-1">{addr.addressLine2}</p>}
                                                <p className="text-gray-600 text-sm">{addr.city}, {addr.state} - {addr.pincode}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Address Modal */}
                        {showAddressModal && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                                <div className="bg-white rounded-lg max-w-md w-full p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Address</h3>
                                    <form onSubmit={handleAddAddress} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Label (e.g., Home, Work)</label>
                                            <input
                                                type="text"
                                                required
                                                value={newAddress.label}
                                                onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                                                className="w-full border rounded-lg p-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                                            <input
                                                type="text"
                                                required
                                                value={newAddress.addressLine1}
                                                onChange={e => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                                                className="w-full border rounded-lg p-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                                            <input
                                                type="text"
                                                value={newAddress.addressLine2}
                                                onChange={e => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                                                className="w-full border rounded-lg p-2"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newAddress.city}
                                                    onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                                    className="w-full border rounded-lg p-2"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newAddress.state}
                                                    onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                                                    className="w-full border rounded-lg p-2"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                                            <input
                                                type="text"
                                                required
                                                value={newAddress.pincode}
                                                onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                                className="w-full border rounded-lg p-2"
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="isDefault"
                                                checked={newAddress.isDefault}
                                                onChange={e => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                                className="mr-2"
                                            />
                                            <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default address</label>
                                        </div>

                                        <div className="flex gap-3 justify-end mt-6">
                                            <button
                                                type="button"
                                                onClick={() => setShowAddressModal(false)}
                                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
                                            >
                                                {loading ? 'Saving...' : 'Save Address'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="Enter current password"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="Enter new password"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="Confirm new password"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                        />
                                    </div>

                                    <button className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors">
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
