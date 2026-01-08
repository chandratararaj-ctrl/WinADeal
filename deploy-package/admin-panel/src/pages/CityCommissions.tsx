import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, MapPin, DollarSign, TrendingUp } from 'lucide-react';
import { cityCommissionService, type CityCommission } from '../services/cityCommission.service';
import { cityService } from '../services/city.service';
import toast from 'react-hot-toast';

export default function CityCommissions() {
    const [commissions, setCommissions] = useState<CityCommission[]>([]);
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCity, setEditingCity] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        city: '',
        vendorCommissionRate: 10.0,
        deliveryCommissionRate: 15.0,
        minOrderAmount: '',
        baseDeliveryFee: '',
        perKmDeliveryFee: '',
        baseDistance: '',
        maxDeliveryRadius: '',
        taxRate: '',
        isActive: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [commissionsData, citiesData] = await Promise.all([
                cityCommissionService.getAll(),
                cityService.getAvailableCities()
            ]);
            setCommissions(commissionsData);
            setAvailableCities(citiesData);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (city: string) => {
        try {
            const commission = commissions.find(c => c.city === city);
            if (!commission) return;

            await cityCommissionService.upsert(city, {
                vendorCommissionRate: commission.vendorCommissionRate,
                deliveryCommissionRate: commission.deliveryCommissionRate,
                minOrderAmount: commission.minOrderAmount,
                baseDeliveryFee: commission.baseDeliveryFee,
                perKmDeliveryFee: commission.perKmDeliveryFee,
                baseDistance: commission.baseDistance,
                maxDeliveryRadius: commission.maxDeliveryRadius,
                taxRate: commission.taxRate,
                isActive: commission.isActive
            });

            toast.success('Commission updated successfully');
            setEditingCity(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update commission');
        }
    };

    const handleDelete = async (city: string) => {
        if (!confirm(`Are you sure you want to delete commission settings for ${city}?`)) {
            return;
        }

        try {
            await cityCommissionService.delete(city);
            toast.success('Commission deleted successfully');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete commission');
        }
    };

    const handleAddNew = async () => {
        try {
            if (!formData.city) {
                toast.error('Please select a city');
                return;
            }

            await cityCommissionService.upsert(formData.city, {
                vendorCommissionRate: formData.vendorCommissionRate,
                deliveryCommissionRate: formData.deliveryCommissionRate,
                minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
                baseDeliveryFee: formData.baseDeliveryFee ? parseFloat(formData.baseDeliveryFee) : null,
                perKmDeliveryFee: formData.perKmDeliveryFee ? parseFloat(formData.perKmDeliveryFee) : null,
                baseDistance: formData.baseDistance ? parseFloat(formData.baseDistance) : null,
                maxDeliveryRadius: formData.maxDeliveryRadius ? parseFloat(formData.maxDeliveryRadius) : null,
                taxRate: formData.taxRate ? parseFloat(formData.taxRate) : null,
                isActive: formData.isActive
            });

            toast.success('Commission added successfully');
            setShowAddModal(false);
            setFormData({
                city: '',
                vendorCommissionRate: 10.0,
                deliveryCommissionRate: 15.0,
                minOrderAmount: '',
                baseDeliveryFee: '',
                perKmDeliveryFee: '',
                baseDistance: '',
                maxDeliveryRadius: '',
                taxRate: '',
                isActive: true
            });
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add commission');
        }
    };

    const updateCommission = (city: string, field: keyof CityCommission, value: any) => {
        setCommissions(prev =>
            prev.map(c =>
                c.city === city ? { ...c, [field]: value } : c
            )
        );
    };

    const citiesWithoutCommission = availableCities.filter(
        city => !commissions.find(c => c.city === city)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">City Commission Settings</h1>
                    <p className="text-gray-600 mt-1">
                        Configure commission rates for different cities
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add City
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <MapPin className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Cities</p>
                            <p className="text-2xl font-bold text-gray-900">{commissions.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Avg Vendor Commission</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {commissions.length > 0
                                    ? (commissions.reduce((sum, c) => sum + c.vendorCommissionRate, 0) / commissions.length).toFixed(1)
                                    : '0'}%
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-100 p-3 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Avg Delivery Commission</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {commissions.length > 0
                                    ? (commissions.reduce((sum, c) => sum + c.deliveryCommissionRate, 0) / commissions.length).toFixed(1)
                                    : '0'}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Commissions Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    City
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vendor Commission (%)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Delivery Commission (%)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Min Order (₹)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Base Fee (₹)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Per Km (₹)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Base Dist (km)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Max Radius (km)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tax (%)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {commissions.map((commission) => (
                                <tr key={commission.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium text-gray-900">{commission.city}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingCity === commission.city ? (
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                value={commission.vendorCommissionRate}
                                                onChange={(e) => updateCommission(commission.city, 'vendorCommissionRate', parseFloat(e.target.value))}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                                            />
                                        ) : (
                                            <span className="text-gray-900">{commission.vendorCommissionRate}%</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingCity === commission.city ? (
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                value={commission.deliveryCommissionRate}
                                                onChange={(e) => updateCommission(commission.city, 'deliveryCommissionRate', parseFloat(e.target.value))}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                                            />
                                        ) : (
                                            <span className="text-gray-900">{commission.deliveryCommissionRate}%</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingCity === commission.city ? (
                                            <input
                                                type="number"
                                                step="1"
                                                min="0"
                                                value={commission.minOrderAmount || ''}
                                                onChange={(e) => updateCommission(commission.city, 'minOrderAmount', e.target.value ? parseFloat(e.target.value) : null)}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                                                placeholder="-"
                                            />
                                        ) : (
                                            <span className="text-gray-900">{commission.minOrderAmount ? `₹${commission.minOrderAmount}` : '-'}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingCity === commission.city ? (
                                            <input
                                                type="number"
                                                step="1"
                                                min="0"
                                                value={commission.baseDeliveryFee || ''}
                                                onChange={(e) => updateCommission(commission.city, 'baseDeliveryFee', e.target.value ? parseFloat(e.target.value) : null)}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                                                placeholder="-"
                                            />
                                        ) : (
                                            <span className="text-gray-900">{commission.baseDeliveryFee ? `₹${commission.baseDeliveryFee}` : '-'}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingCity === commission.city ? (
                                            <input
                                                type="number"
                                                step="1"
                                                min="0"
                                                value={commission.perKmDeliveryFee || ''}
                                                onChange={(e) => updateCommission(commission.city, 'perKmDeliveryFee', e.target.value ? parseFloat(e.target.value) : null)}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                                                placeholder="-"
                                            />
                                        ) : (
                                            <span className="text-gray-900">{commission.perKmDeliveryFee ? `₹${commission.perKmDeliveryFee}` : '-'}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingCity === commission.city ? (
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={commission.baseDistance || ''}
                                                onChange={(e) => updateCommission(commission.city, 'baseDistance', e.target.value ? parseFloat(e.target.value) : null)}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                                                placeholder="-"
                                            />
                                        ) : (
                                            <span className="text-gray-900">{commission.baseDistance ? `${commission.baseDistance} km` : '-'}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingCity === commission.city ? (
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={commission.maxDeliveryRadius || ''}
                                                onChange={(e) => updateCommission(commission.city, 'maxDeliveryRadius', e.target.value ? parseFloat(e.target.value) : null)}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                                                placeholder="-"
                                            />
                                        ) : (
                                            <span className="text-gray-900">{commission.maxDeliveryRadius ? `${commission.maxDeliveryRadius} km` : '-'}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingCity === commission.city ? (
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                value={commission.taxRate || ''}
                                                onChange={(e) => updateCommission(commission.city, 'taxRate', e.target.value ? parseFloat(e.target.value) : null)}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                                                placeholder="-"
                                            />
                                        ) : (
                                            <span className="text-gray-900">{commission.taxRate ? `${commission.taxRate}%` : '-'}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingCity === commission.city ? (
                                            <select
                                                value={commission.isActive ? 'active' : 'inactive'}
                                                onChange={(e) => updateCommission(commission.city, 'isActive', e.target.value === 'active')}
                                                className="px-2 py-1 border border-gray-300 rounded"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${commission.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {commission.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {editingCity === commission.city ? (
                                                <>
                                                    <button
                                                        onClick={() => handleSave(commission.city)}
                                                        className="text-green-600 hover:text-green-700"
                                                        title="Save"
                                                    >
                                                        <Save className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingCity(null);
                                                            fetchData();
                                                        }}
                                                        className="text-gray-600 hover:text-gray-700"
                                                        title="Cancel"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => setEditingCity(commission.city)}
                                                        className="text-indigo-600 hover:text-indigo-700"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(commission.city)}
                                                        className="text-red-600 hover:text-red-700"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {commissions.length === 0 && (
                    <div className="text-center py-12">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No city commissions configured yet</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Add your first city
                        </button>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Add City Commission</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    City
                                </label>
                                <select
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="">Select a city</option>
                                    {citiesWithoutCommission.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Vendor Commission Rate (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={formData.vendorCommissionRate}
                                    onChange={(e) => setFormData({ ...formData, vendorCommissionRate: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Delivery Commission Rate (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={formData.deliveryCommissionRate}
                                    onChange={(e) => setFormData({ ...formData, deliveryCommissionRate: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Minimum Order Amount (₹) - Optional
                                </label>
                                <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={formData.minOrderAmount}
                                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Leave empty for default"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Base Delivery Fee (₹)
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        min="0"
                                        value={formData.baseDeliveryFee}
                                        onChange={(e) => setFormData({ ...formData, baseDeliveryFee: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Optional"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Per Km Fee (₹)
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        min="0"
                                        value={formData.perKmDeliveryFee}
                                        onChange={(e) => setFormData({ ...formData, perKmDeliveryFee: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Base Distance (km)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={formData.baseDistance}
                                        onChange={(e) => setFormData({ ...formData, baseDistance: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Optional"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Free delivery up to this distance</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Max Delivery Radius (km)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={formData.maxDeliveryRadius}
                                        onChange={(e) => setFormData({ ...formData, maxDeliveryRadius: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Optional"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Maximum delivery distance</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tax Rate (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={formData.taxRate}
                                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Optional"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="isActive" className="text-sm text-gray-700">
                                    Active
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleAddNew}
                                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Add Commission
                            </button>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
