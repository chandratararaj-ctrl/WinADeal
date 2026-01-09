import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, Mail, FileText, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { createShop } from '../services/shop.service';
import { productService } from '../services/product.service';
import { useAuthStore } from '../store/authStore';
import DocumentUpload from '../components/DocumentUpload';

export default function CreateShop() {
    const navigate = useNavigate();
    const { user, updateUser, clearAuth } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        city: '',
        phone: user?.phone || '',
        email: user?.email || '',
        categoryId: '',
        gstin: '',
        fssaiNumber: '',
        minOrderAmount: '0',
        deliveryRadius: '5',
    });

    useEffect(() => {
        loadCategories();
        fetchCities();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await productService.getCategories();
            if (Array.isArray(data)) {
                setCategories(data);
            }
        } catch (error) {
            console.error('Failed to load categories', error);
        }
    };

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

    const fetchCities = async () => {
        try {
            const response = await fetch(`${API_URL}/cities/active`);
            const result = await response.json();
            if (result.success && Array.isArray(result.data)) {
                setCities(result.data.map((city: any) => city.name));
            }
        } catch (error) {
            console.error('Failed to load cities', error);
            toast.error('Failed to load cities');
        }
    };

    const handleLogout = () => {
        clearAuth();
        navigate('/login');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const shopData = {
                ...formData,
                minOrderAmount: Number(formData.minOrderAmount),
                deliveryRadius: Number(formData.deliveryRadius),
            };

            const newShop = await createShop(shopData);

            // Update auth store with new shop details
            updateUser({
                shop: {
                    id: newShop.id,
                    name: newShop.name,
                    isVerified: newShop.isVerified,
                    isActive: newShop.isOpen, // Mapping isOpen to isActive for store consistency
                    rating: newShop.rating,
                    city: newShop.city,
                }
            });

            toast.success('Shop created successfully!');
            navigate('/');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to create shop';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
            <div className="absolute top-4 right-4">
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-primary-100 p-3 rounded-full">
                        <Store className="w-10 h-10 text-primary-600" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Setup your Store
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Tell us about your business to get started
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Shop Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Shop Name</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Store className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 py-2 border"
                                    placeholder="My Awesome Store"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <div className="mt-1">
                                <textarea
                                    name="description"
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                                    placeholder="Brief description of your store..."
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <div className="mt-1">
                                <select
                                    name="categoryId"
                                    required
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                >
                                    <option value="">Select a Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 py-2 border"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 py-2 border"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Address</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="address"
                                    required
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 py-2 border"
                                    placeholder="Store address..."
                                />
                            </div>
                        </div>

                        {/* City */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700">City</label>
                            <div className="mt-1">
                                <select
                                    name="city"
                                    required
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                >
                                    <option value="">Select a City</option>
                                    {cities.map((city) => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Licensing */}
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">GSTIN (Optional)</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FileText className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="gstin"
                                        value={formData.gstin}
                                        onChange={handleChange}
                                        className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 py-2 border"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">FSSAI Number (Optional)</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FileText className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="fssaiNumber"
                                        value={formData.fssaiNumber}
                                        onChange={handleChange}
                                        className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 py-2 border"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Document Uploads */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h3>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                <DocumentUpload
                                    label="GST Certificate"
                                    type="GST_CERTIFICATE"
                                    onUploadComplete={(url) => console.log('GST Uploaded', url)}
                                />
                                <DocumentUpload
                                    label="FSSAI License"
                                    type="FSSAI_LICENSE"
                                    onUploadComplete={(url) => console.log('FSSAI Uploaded', url)}
                                />
                                <DocumentUpload
                                    label="Shop License"
                                    type="SHOP_LICENSE"
                                    onUploadComplete={(url) => console.log('Shop License Uploaded', url)}
                                />
                                <DocumentUpload
                                    label="ID Proof (Aadhar/PAN)"
                                    type="ID_PROOF"
                                    onUploadComplete={(url) => console.log('ID Uploaded', url)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary py-3 text-base font-semibold flex items-center justify-center space-x-2 mt-6"
                            >
                                {isLoading ? 'Creating Store...' : 'Create Store'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
