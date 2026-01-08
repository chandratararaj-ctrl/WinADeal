import { useState, useEffect } from 'react';
import { MapPin, Save, Store, Clock, Phone, Mail, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { shopService } from '../services/shop.service'; // Ensure this is exported from shop.service
import { getCurrentUser } from '../services/auth.service';
import type { ShopSettings } from '../types';
import DocumentUpload from '../components/DocumentUpload';
import { FileText } from 'lucide-react';
import MapPicker from '../components/MapPicker';

export default function Settings() {
    const { user } = useAuthStore();
    const shop = user?.shop;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        contactPhone: '', // Currently shop uses user phone usually, but let's see if we have shop phone
        deliveryRadius: 5,
        minOrderAmount: 0,
        openingTime: '',
        closingTime: '',
        latitude: 0,
        longitude: 0,
    });

    useEffect(() => {
        fetchShopDetails();
    }, []); // Only run once on mount

    const fetchShopDetails = async () => {
        try {
            // Refetch full user/shop details to get all fields
            const userData = await getCurrentUser();
            const fullShop = userData.shop;
            if (fullShop) {
                setFormData({
                    name: fullShop.name || '',
                    description: fullShop.description || '',
                    address: fullShop.address || '',
                    contactPhone: fullShop.phone || user?.phone || '',
                    deliveryRadius: fullShop.deliveryRadiusKm || 5,
                    minOrderAmount: fullShop.minOrderAmount || 0,
                    openingTime: fullShop.openingTime || '',
                    closingTime: fullShop.closingTime || '',
                    latitude: fullShop.latitude || 28.6139, // Default to Delhi if missing
                    longitude: fullShop.longitude || 77.2090,
                });
            }
        } catch (error) {
            console.error('Failed to fetch shop details');
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleLocateAddress = async () => {
        if (!formData.address) {
            toast.error("Please enter an address first");
            return;
        }

        const toastId = toast.loading("Searching for address...");
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newLat = parseFloat(lat);
                const newLng = parseFloat(lon);

                setFormData(prev => ({
                    ...prev,
                    latitude: newLat,
                    longitude: newLng
                }));
                toast.success("Location found!", { id: toastId });
            } else {
                toast.error("Address not found on map", { id: toastId });
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            toast.error("Failed to locate address", { id: toastId });
        }
    };

    const handleSave = async () => {
        if (!shop?.id) {
            console.error("Shop ID mismatch or missing in handleSave", shop);
            toast.error("Cannot save: Shop ID not found. Please reload.");
            return;
        }
        setLoading(true);
        try {
            // Map form data to API expected format
            const apiData = {
                name: formData.name,
                description: formData.description,
                address: formData.address,
                deliveryRadiusKm: Number(formData.deliveryRadius), // Map to backend field name
                minOrderAmount: Number(formData.minOrderAmount),
                openingTime: formData.openingTime,
                closingTime: formData.closingTime,
                latitude: Number(formData.latitude),
                longitude: Number(formData.longitude)
            };

            console.log('Saving Shop Settings:', apiData); // Debug log

            await shopService.updateShop(shop.id, apiData);
            toast.success('Shop settings updated successfully!');
            // Update auth store if needed (optional, but good practice)
            // fetchShopDetails(); // We can re-fetch to be sure
        } catch (error) {
            console.error("Update failed", error);
            toast.error('Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    if (!shop) {
        return <div className="p-6">Loading shop details... (or missing shop)</div>;
    }

    return (
        <div className="p-6 animate-fade-in">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Shop Settings</h1>
                <p className="text-gray-600 mt-1">Manage your shop details, delivery preferences, and timings</p>
                {shop.isVerified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                        Verified Shop
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                        Verification Pending
                    </span>
                )}
            </div>

            <div className="flex justify-between items-center mb-6">
                <div>{/* Spacer or additional header info if needed */}</div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className={`hidden md:flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    <Save className="w-5 h-5" />
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="space-y-6 max-w-4xl">
                {/* Basic Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Store className="w-5 h-5 text-indigo-600" />
                        Basic Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Shop Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address
                            </label>
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleLocateAddress();
                                        }
                                    }}
                                    placeholder="Enter shop address"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <button
                                    type="button"
                                    onClick={handleLocateAddress}
                                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 flex items-center gap-2 transition-colors whitespace-nowrap"
                                    title="Find address on map"
                                >
                                    <MapPin className="w-4 h-4" />
                                    Locate on Map
                                </button>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pin Location on Map
                            </label>

                            {/* Use Google Maps if key is available, otherwise fallback or show error */}
                            <MapPicker
                                initialLocation={{
                                    lat: formData.latitude || 28.6139,
                                    lng: formData.longitude || 77.2090
                                }}
                                onLocationSelect={(loc) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        latitude: loc.lat,
                                        longitude: loc.lng
                                    }));
                                }}
                            />

                            {formData.latitude && formData.longitude && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Selected Coordinates: {Number(formData.latitude).toFixed(6)}, {Number(formData.longitude).toFixed(6)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Operations & Delivery */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        Operations & Delivery
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Opening Time
                            </label>
                            <input
                                type="time"
                                value={formData.openingTime}
                                onChange={(e) => handleChange('openingTime', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Closing Time
                            </label>
                            <input
                                type="time"
                                value={formData.closingTime}
                                onChange={(e) => handleChange('closingTime', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                Delivery Radius (km)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.deliveryRadius}
                                onChange={(e) => handleChange('deliveryRadius', Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Min Order Amount (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.minOrderAmount}
                                onChange={(e) => handleChange('minOrderAmount', Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>



                {/* Documents - Enable re-upload */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Documents
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Upload new documents if your previous ones were rejected or expired.
                    </p>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <DocumentUpload
                            label="GST Certificate"
                            type="GST_CERTIFICATE"
                            onUploadComplete={(url) => toast.success('GST Certificate Updated')}
                        />
                        <DocumentUpload
                            label="FSSAI License"
                            type="FSSAI_LICENSE"
                            onUploadComplete={(url) => toast.success('FSSAI License Updated')}
                        />
                        <DocumentUpload
                            label="Shop License"
                            type="SHOP_LICENSE"
                            onUploadComplete={(url) => toast.success('Shop License Updated')}
                        />
                        <DocumentUpload
                            label="ID Proof (Aadhar/PAN)"
                            type="ID_PROOF"
                            onUploadComplete={(url) => toast.success('ID Proof Updated')}
                        />
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 pb-10">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        <Save className="w-5 h-5" />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
