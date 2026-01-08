import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Clock, MapPin, TrendingUp } from 'lucide-react';
import { categoryService, shopService, type Shop } from '../services/shop.service';
import { cityService } from '../services/city.service';
import { useCityStore } from '../store/cityStore';
import toast from 'react-hot-toast';

interface Category {
    id: string;
    name: string;
    type: string;
    icon: string;
}

export default function Home() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [featuredShops, setFeaturedShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const { selectedCity } = useCityStore();

    useEffect(() => {
        fetchData();
    }, [selectedCity]); // Refetch when city changes

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch categories
            const categoriesRes = await categoryService.getCategories();
            if (categoriesRes.success) {
                setCategories(categoriesRes.data.slice(0, 8)); // Show first 8
            }

            // Fetch shops filtered by city
            if (selectedCity) {
                const shops = await cityService.getShopsByCity(selectedCity);
                setFeaturedShops(shops.slice(0, 6)); // Show first 6
            } else {
                // Fallback to all shops if no city selected
                const shopsRes = await shopService.getShops({ isOpen: true });
                if (shopsRes.success) {
                    setFeaturedShops(shopsRes.data.shops.slice(0, 6));
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            Order Food & Groceries
                            <br />
                            <span className="text-sky-200">Delivered to Your Door</span>
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-sky-100">
                            Fresh food, groceries, and more from local shops
                        </p>
                        <Link
                            to="/shops"
                            className="inline-flex items-center space-x-2 bg-white text-sky-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-sky-50 transition-all transform hover:scale-105"
                        >
                            <span>Explore Shops</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Browse by Category</h2>
                    <Link to="/shops" className="text-sky-600 hover:text-sky-700 font-medium">
                        View All →
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                to={`/shops?category=${category.id}`}
                                className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-all transform hover:scale-105 cursor-pointer"
                            >
                                <div className="text-4xl mb-3">{category.icon}</div>
                                <h3 className="font-medium text-gray-900 text-sm">{category.name}</h3>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Featured Shops */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Featured Shops</h2>
                    <Link to="/shops" className="text-sky-600 hover:text-sky-700 font-medium">
                        View All →
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-gray-100 rounded-lg overflow-hidden animate-pulse">
                                <div className="h-48 bg-gray-200"></div>
                                <div className="p-4 space-y-3">
                                    <div className="h-6 bg-gray-200 rounded"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredShops.map((shop) => (
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
                )}
            </section>

            {/* How It Works */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="bg-sky-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">🔍</span>
                        </div>
                        <h3 className="font-bold text-xl mb-2">Browse Shops</h3>
                        <p className="text-gray-600">
                            Discover local restaurants and grocery stores in your area
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="bg-sky-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">🛒</span>
                        </div>
                        <h3 className="font-bold text-xl mb-2">Order Online</h3>
                        <p className="text-gray-600">
                            Add items to cart and place your order with just a few clicks
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="bg-sky-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">🚚</span>
                        </div>
                        <h3 className="font-bold text-xl mb-2">Fast Delivery</h3>
                        <p className="text-gray-600">
                            Get your order delivered to your doorstep in minutes
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ready to Order?
                    </h2>
                    <p className="text-xl mb-8 text-sky-100">
                        Join thousands of happy customers enjoying fast delivery
                    </p>
                    <Link
                        to="/shops"
                        className="inline-flex items-center space-x-2 bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-sky-50 transition-all transform hover:scale-105"
                    >
                        <span>Start Shopping</span>
                        <TrendingUp className="w-5 h-5" />
                    </Link>
                </div>
            </section>
        </div>
    );
}
