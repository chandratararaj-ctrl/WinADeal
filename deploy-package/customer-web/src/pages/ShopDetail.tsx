import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin, Plus, Minus, ShoppingCart, ArrowLeft } from 'lucide-react';
import { shopService, type Shop, type Product } from '../services/shop.service';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

export default function ShopDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addItem } = useCartStore();

    const [shop, setShop] = useState<Shop | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        if (id) {
            fetchShopDetails();
        }
    }, [id]);

    const fetchShopDetails = async () => {
        try {
            setLoading(true);
            const res = await shopService.getShopById(id!);
            if (res.success) {
                setShop(res.data);
                setProducts(res.data.products || []);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load shop');
            navigate('/shops');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (product: Product) => {
        const quantity = quantities[product.id] || 1;

        addItem({
            id: `${product.id}-${Date.now()}`,
            productId: product.id,
            name: product.name,
            price: product.discountedPrice || product.price,
            image: product.images[0],
            shopId: shop!.id,
            shopName: shop!.name,
            quantity: quantity,
        });

        toast.success(`${product.name} added to cart!`);
        setQuantities({ ...quantities, [product.id]: 1 });
    };

    const updateQuantity = (productId: string, delta: number) => {
        const current = quantities[productId] || 1;
        const newQty = Math.max(1, current + delta);
        setQuantities({ ...quantities, [productId]: newQty });
    };

    const categories = [...new Set(products.map(p => p.category?.name).filter(Boolean))];
    const filteredProducts = selectedCategory
        ? products.filter(p => p.category?.name === selectedCategory)
        : products;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading shop...</p>
                </div>
            </div>
        );
    }

    if (!shop) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Shop Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <button
                        onClick={() => navigate('/shops')}
                        className="flex items-center text-gray-600 hover:text-sky-600 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Shops
                    </button>

                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-48 h-48 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-lg flex items-center justify-center">
                            <span className="text-8xl">🍕</span>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{shop.name}</h1>
                                    <p className="text-gray-600 mb-4">{shop.description}</p>
                                </div>
                                {shop.isOpen && (
                                    <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                                        Open Now
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                                    <span className="font-medium text-gray-900">{shop.rating.toFixed(1)}</span>
                                    <span>({shop.totalOrders} orders)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5" />
                                    <span>{shop.avgPrepTimeMins} mins</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <MapPin className="w-5 h-5" />
                                    <span>{shop.deliveryRadiusKm} km delivery</span>
                                </div>
                            </div>

                            <div className="mt-4">
                                <span className="inline-block bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm font-medium">
                                    {shop.category.name}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Category Filter */}
                {categories.length > 0 && (
                    <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setSelectedCategory('')}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${selectedCategory === ''
                                ? 'bg-sky-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            All Items
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat!)}
                                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                                    ? 'bg-sky-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Products Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🍽️</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No items available</h3>
                        <p className="text-gray-600">Check back later for menu items</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <div className="relative h-48 bg-gray-200">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={product.images[0]}
                                            onError={(e) => {
                                                e.currentTarget.src = `https://placehold.co/400x300?text=${encodeURIComponent(product.name)}`;
                                            }}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-200 to-indigo-300">
                                            <span className="text-6xl">🍕</span>
                                        </div>
                                    )}
                                    {product.isVeg && (
                                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                                            VEG
                                        </div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <h3 className="font-bold text-lg text-gray-900 mb-1">{product.name}</h3>
                                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                        {product.description || 'Delicious item from our menu'}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            {product.discountedPrice ? (
                                                <div>
                                                    <span className="text-xl font-bold text-gray-900">
                                                        ₹{product.discountedPrice}
                                                    </span>
                                                    <span className="text-sm text-gray-500 line-through ml-2">
                                                        ₹{product.price}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => updateQuantity(product.id, -1)}
                                                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-8 text-center font-medium">
                                                {quantities[product.id] || 1}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(product.id, 1)}
                                                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleAddToCart(product)}
                                        disabled={!product.isAvailable}
                                        className="w-full mt-4 bg-sky-600 text-white py-2 rounded-lg font-medium hover:bg-sky-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        <span>{product.isAvailable ? 'Add to Cart' : 'Not Available'}</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
