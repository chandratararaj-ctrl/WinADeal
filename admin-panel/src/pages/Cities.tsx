import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Building2, Users } from 'lucide-react';
import { cityService } from '../services/city.service';
import Toast from '../utils/Toast';

interface City {
    id: string;
    name: string;
    state: string;
    isActive: boolean;
    displayOrder: number;
}

interface CityStats {
    id: string;
    name: string;
    state: string;
    shopsCount: number;
    activeShopsCount: number;
    deliveryPartnersCount: number;
}

export default function Cities() {
    const [cities, setCities] = useState<City[]>([]);
    const [cityStats, setCityStats] = useState<CityStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCity, setEditingCity] = useState<City | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        state: 'West Bengal',
        displayOrder: 0
    });

    useEffect(() => {
        fetchCities();
        fetchCityStats();
    }, []);

    const fetchCities = async () => {
        try {
            const data = await cityService.getAllCities();
            setCities(data);
        } catch (error) {
            Toast.error('Failed to fetch cities');
        } finally {
            setLoading(false);
        }
    };

    const fetchCityStats = async () => {
        try {
            const data = await cityService.getCityStats();
            setCityStats(data);
        } catch (error) {
            console.error('Failed to fetch city stats:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingCity) {
                await cityService.updateCity(editingCity.id, formData);
                Toast.success('City updated successfully');
            } else {
                await cityService.createCity(formData);
                Toast.success('City created successfully');
            }

            setShowModal(false);
            setEditingCity(null);
            setFormData({ name: '', state: 'West Bengal', displayOrder: 0 });
            fetchCities();
            fetchCityStats();
        } catch (error: any) {
            Toast.error(error.response?.data?.message || 'Failed to save city');
        }
    };

    const handleEdit = (city: City) => {
        setEditingCity(city);
        setFormData({
            name: city.name,
            state: city.state,
            displayOrder: city.displayOrder
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            return;
        }

        try {
            await cityService.deleteCity(id);
            Toast.success('City deleted successfully');
            fetchCities();
            fetchCityStats();
        } catch (error: any) {
            Toast.error(error.response?.data?.message || 'Failed to delete city');
        }
    };

    const handleToggleActive = async (city: City) => {
        try {
            await cityService.updateCity(city.id, { isActive: !city.isActive });
            Toast.success(`City ${city.isActive ? 'deactivated' : 'activated'} successfully`);
            fetchCities();
        } catch (error) {
            Toast.error('Failed to update city status');
        }
    };

    const getCityStatsById = (cityId: string) => {
        return cityStats.find(stat => stat.id === cityId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">City Management</h1>
                    <p className="text-gray-600 mt-1">Manage cities available on the platform</p>
                </div>
                <button
                    onClick={() => {
                        setEditingCity(null);
                        setFormData({ name: '', state: 'West Bengal', displayOrder: 0 });
                        setShowModal(true);
                    }}
                    className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add City
                </button>
            </div>

            {/* Cities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cities.map((city) => {
                    const stats = getCityStatsById(city.id);
                    return (
                        <div
                            key={city.id}
                            className={`bg-white rounded-lg shadow-md p-6 border-2 ${city.isActive ? 'border-transparent' : 'border-gray-300 opacity-60'
                                }`}
                        >
                            {/* City Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-sky-100 p-3 rounded-lg">
                                        <MapPin className="w-6 h-6 text-sky-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{city.name}</h3>
                                        <p className="text-sm text-gray-500">{city.state}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(city)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(city.id, city.name)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Stats */}
                            {stats && (
                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Building2 className="w-4 h-4" />
                                            <span>Total Shops</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">{stats.shopsCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Building2 className="w-4 h-4" />
                                            <span>Active Shops</span>
                                        </div>
                                        <span className="font-semibold text-green-600">{stats.activeShopsCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Users className="w-4 h-4" />
                                            <span>Delivery Partners</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">{stats.deliveryPartnersCount}</span>
                                    </div>
                                </div>
                            )}

                            {/* Status Toggle */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <span className="text-sm text-gray-600">Status</span>
                                <button
                                    onClick={() => handleToggleActive(city)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${city.isActive
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    {city.isActive ? 'Active' : 'Inactive'}
                                </button>
                            </div>

                            {/* Display Order */}
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-sm text-gray-600">Display Order</span>
                                <span className="text-sm font-medium text-gray-900">{city.displayOrder}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {cities.length === 0 && (
                <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No cities yet</h3>
                    <p className="text-gray-600 mb-4">Get started by adding your first city</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700 transition-colors"
                    >
                        Add City
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {editingCity ? 'Edit City' : 'Add New City'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    City Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                    placeholder="e.g., Kolkata"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    State *
                                </label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                    placeholder="e.g., West Bengal"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Display Order
                                </label>
                                <input
                                    type="number"
                                    value={formData.displayOrder}
                                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                    placeholder="0"
                                    min="0"
                                />
                                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingCity(null);
                                        setFormData({ name: '', state: 'West Bengal', displayOrder: 0 });
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                                >
                                    {editingCity ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
