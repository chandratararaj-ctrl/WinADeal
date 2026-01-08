import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Star, Clock, MapPin } from 'lucide-react';
import { shopService, categoryService, type Shop } from '../services/shop.service';
import toast from 'react-hot-toast';

interface Category {
    id: string;
    name: string;
    icon: string;
}

export default function Shops() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [shops, setShops] = useState<Shop[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchShops();
    }, [selectedCategory, searchQuery]);

    const fetchCategories = async () => {
        try {
            const res = await categoryService.getCategories();
            if (res.success) {
                setCategories(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchShops = async () => {
        try {
            setLoading(true);
            const params: any = { isOpen: true };
            if (selectedCategory) params.categoryId = selectedCategory;
            if (searchQuery) params.search = searchQuery;

            const res = await shopService.getShops(params);
            if (res.success) {
                setShops(res.data.shops);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load shops');
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (categoryId: string) => {
        setSelectedCategory(categoryId);
        if (categoryId) {
            setSearchParams({ category: categoryId });
        } else {
            setSearchParams({});
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Shops</h1>
                    <p className="text-gray-600">Discover amazing food and groceries near you</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search shops..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="md:w-64">
                            <select
                                value={selectedCategory}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
                                <div className="h-48 bg-gray-200"></div>
                                <div className="p-4 space-y-3">
                                    <div className="h-6 bg-gray-200 rounded"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : shops.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No shops found</h3>
                        <p className="text-gray-600">Try adjusting your filters or search query</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 text-gray-600">
                            Found {shops.length} shop{shops.length !== 1 ? 's' : ''}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {shops.map((shop) => (
                                <Link
                                    key={shop.id}
                                    to={`/shops/${shop.id}`}
                                    className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all transform hover:scale-105"
                                >
                                    <div className="relative h-48 bg-gradient-to-br from-sky-400 to-indigo-500">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-6xl">🍕</span>
                                        </div>
                                        {shop.isOpen && (
                                            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                                Open
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">{shop.name}</h3>
                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                            {shop.description || 'Delicious food delivered to your door'}
                                        </p>
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <div className="flex items-center space-x-1">
                                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                <span className="font-medium text-gray-900">{shop.rating.toFixed(1)}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{shop.avgPrepTimeMins} mins</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <MapPin className="w-4 h-4" />
                                                <span>{shop.deliveryRadiusKm} km</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <span className="inline-block bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-medium">
                                                {shop.category.name}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
