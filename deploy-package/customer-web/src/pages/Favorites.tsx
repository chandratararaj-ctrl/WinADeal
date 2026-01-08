import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useFavoritesStore } from '../store/favoritesStore';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Favorites() {
    const [activeTab, setActiveTab] = useState<'shops' | 'products'>('shops');
    const {
        favoriteShops,
        favoriteProducts,
        removeShopFromFavorites,
        removeProductFromFavorites
    } = useFavoritesStore();

    const handleRemoveShop = (shopId: string, shopName: string) => {
        removeShopFromFavorites(shopId);
        toast.success(`Removed ${shopName} from favorites`);
    };

    const handleRemoveProduct = (productId: string, productName: string) => {
        removeProductFromFavorites(productId);
        toast.success(`Removed ${productName} from favorites`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                        <Heart className="w-8 h-8 text-red-500 fill-current" />
                        My Favorites
                    </h1>
                    <p className="text-gray-600">Your saved shops and products</p>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 mb-6">
                    <button
                        onClick={() => setActiveTab('shops')}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'shops'
                                ? 'bg-sky-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Shops ({favoriteShops.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'products'
                                ? 'bg-sky-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Products ({favoriteProducts.length})
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'shops' ? (
                    favoriteShops.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl">
                            <div className="text-6xl mb-4">❤️</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorite shops yet</h3>
                            <p className="text-gray-600 mb-6">Start adding shops you love!</p>
                            <Link
                                to="/shops"
                                className="inline-block bg-sky-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-sky-700 transition-colors"
                            >
                                Browse Shops
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {favoriteShops.map((shop) => (
                                <div key={shop.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
                                    <div className="relative h-48 bg-gradient-to-br from-sky-400 to-indigo-500">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-6xl">🍕</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveShop(shop.id, shop.name)}
                                            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors group"
                                        >
                                            <Heart className="w-5 h-5 text-red-500 fill-current group-hover:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">{shop.name}</h3>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-yellow-500 flex items-center gap-1">
                                                ⭐ {shop.rating.toFixed(1)}
                                            </span>
                                            <span className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-medium">
                                                {shop.category}
                                            </span>
                                        </div>
                                        <Link
                                            to={`/shops/${shop.id}`}
                                            className="mt-4 block w-full bg-sky-600 text-white text-center py-2 rounded-lg font-medium hover:bg-sky-700 transition-colors"
                                        >
                                            Visit Shop
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    favoriteProducts.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl">
                            <div className="text-6xl mb-4">🛒</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorite products yet</h3>
                            <p className="text-gray-600 mb-6">Save products you want to order later!</p>
                            <Link
                                to="/shops"
                                className="inline-block bg-sky-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-sky-700 transition-colors"
                            >
                                Browse Products
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {favoriteProducts.map((product) => (
                                <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                                    <div className="relative aspect-square bg-gray-100">
                                        <div className="absolute inset-0 flex items-center justify-center text-6xl">
                                            🍔
                                        </div>
                                        <button
                                            onClick={() => handleRemoveProduct(product.id, product.name)}
                                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                                        >
                                            <Heart className="w-4 h-4 text-red-500 fill-current" />
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
                                        <p className="text-xs text-gray-500 mb-2">{product.shopName}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                                            <Link
                                                to={`/shops/${product.shopId}`}
                                                className="text-sky-600 text-sm font-medium hover:text-sky-700"
                                            >
                                                Order Now
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
