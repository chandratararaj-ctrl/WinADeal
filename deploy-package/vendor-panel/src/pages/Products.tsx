import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Package, TrendingUp, DollarSign, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { productService } from '../services/product.service';
import type { Product, CreateProductData } from '../services/product.service';
import { useAuthStore } from '../store/authStore';

export default function Products() {
    const { user } = useAuthStore();
    const shopId = user?.shop?.id;

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<any[]>([]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    // Modal State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('view');

    // Form State
    const [formData, setFormData] = useState<CreateProductData>({
        name: '',
        description: '',
        price: 0,
        discountPrice: 0,
        categoryId: '',
        shopId: shopId || '',
        isVeg: true,
        stock: 0,
        image: '',
    });

    const fetchProducts = useCallback(async () => {
        if (!shopId) return;
        setLoading(true);
        try {
            const data = await productService.getShopProducts(shopId, {
                search: searchQuery,
                categoryId: categoryFilter,
                // Status filtering is done on frontend or we need to add param to API
            });

            let fetchedProducts = data.products || [];

            // Client-side status filter since API might not support it fully for 'all' vs 'active'
            if (statusFilter !== 'all') {
                fetchedProducts = fetchedProducts.filter((p: Product) =>
                    statusFilter === 'active' ? p.isAvailable : !p.isAvailable
                );
            }

            setProducts(fetchedProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    }, [shopId, searchQuery, categoryFilter, statusFilter]);

    const fetchCategories = useCallback(async () => {
        try {
            const data = await productService.getCategories();
            setCategories(data.data || data); // Adjust based on API structure
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }, []);

    useEffect(() => {
        if (shopId) {
            fetchProducts();
        }
        fetchCategories();
    }, [shopId, categoryFilter, statusFilter, fetchProducts, fetchCategories]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (shopId) fetchProducts();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, shopId, fetchProducts]);

    const handleToggleActive = async (product: Product) => {
        try {
            await productService.updateProduct(product.id, {
                isAvailable: !product.isAvailable
            });
            toast.success(`Product ${product.isAvailable ? 'deactivated' : 'activated'} successfully`);
            fetchProducts();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update product status');
        }
    };



    const handleOpenModal = (mode: 'view' | 'edit' | 'add', product?: Product) => {
        setModalMode(mode);
        setSelectedProduct(product || null);

        if (mode === 'add') {
            setFormData({
                name: '',
                description: '',
                price: 0,
                discountPrice: 0,
                categoryId: categories[0]?.id || '',
                shopId: shopId || '',
                isVeg: true,
                stock: 0,
                image: '',
            });
        } else if (product && (mode === 'edit' || mode === 'view')) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price || 0,
                discountPrice: product.discountPrice || 0,
                categoryId: product.categoryId || '',
                shopId: product.shopId || '',
                isVeg: product.isVeg !== undefined ? product.isVeg : true,
                stock: product.stockQuantity || 0,
                image: product.images?.[0] || '',
            });
        }

        setShowModal(true);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (modalMode === 'add') {
                await productService.createProduct({
                    ...formData,
                    shopId: shopId!,
                });
                toast.success('Product added successfully!');
            } else if (modalMode === 'edit' && selectedProduct) {
                await productService.updateProduct(selectedProduct.id, formData);
                toast.success('Product updated successfully!');
            }
            setShowModal(false);
            fetchProducts();
        } catch (error) {
            toast.error(`Failed to ${modalMode} product`);
        }
    };

    const stats = {
        total: products.length,
        active: products.filter((p) => p.isAvailable).length,
        outOfStock: products.filter((p) => p.stockQuantity === 0).length,
        totalRevenue: products.reduce((sum, p) => sum + (p.price * (p.totalSales || 0)), 0),
    };

    if (!shopId) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-bold text-red-600">Shop Not Found</h2>
                <p className="text-gray-600">Please contact support to link your account to a shop.</p>
            </div>
        );
    }

    return (
        <div className="p-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
                    <p className="text-gray-600 mt-1">Manage your shop's menu and inventory</p>
                </div>
                <button
                    onClick={() => handleOpenModal('add')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Product
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Products</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Products</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Out of Stock</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{stats.outOfStock}</p>
                        </div>
                        <div className="bg-red-100 p-3 rounded-lg">
                            <Package className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">₹{stats.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-lg">
                            <DollarSign className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        {['all', 'active', 'inactive'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status as any)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === status
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="text-center py-12">Loading products...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            {/* Product Image */}
                            <div className="relative h-48 bg-gray-100">
                                {product.images?.[0] ? (
                                    <img
                                        src={product.images[0]}
                                        onError={(e) => {
                                            e.currentTarget.src = `https://placehold.co/400x300?text=${encodeURIComponent(product.name)}`;
                                        }}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                        <Package className="w-16 h-16" />
                                    </div>
                                )}

                                {product.discountPrice && (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                                        {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                                    </div>
                                )}
                                {!product.isAvailable && (
                                    <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 rounded-lg text-xs font-bold">
                                        Inactive
                                    </div>
                                )}
                                {product.stockQuantity === 0 && (
                                    <div className="absolute bottom-2 left-2 bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-bold">
                                        Out of Stock
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
                                <p className="text-sm text-gray-600 mb-2">{product.category?.name}</p>
                                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>

                                {/* Price */}
                                <div className="flex items-center gap-2 mb-3">
                                    {product.discountPrice ? (
                                        <>
                                            <span className="text-lg font-bold text-gray-900">₹{product.discountPrice}</span>
                                            <span className="text-sm text-gray-500 line-through">₹{product.price}</span>
                                        </>
                                    ) : (
                                        <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        <span>{product.rating || 'New'}</span>
                                    </div>
                                    <span>Stock: {product.stockQuantity}</span>
                                    <span>{product.totalSales || 0} sold</span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal('view', product)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </button>
                                    <button
                                        onClick={() => handleOpenModal('edit', product)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(product)}
                                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${product.isAvailable
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                            }`}
                                    >
                                        {product.isAvailable ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && products.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-4">Get started by adding your first product!</p>
                    <button
                        onClick={() => handleOpenModal('add')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Add Product
                    </button>
                </div>
            )}

            {/* Product Modal (View/Edit/Add) */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">
                                {modalMode === 'add' ? 'Add New Product' : modalMode === 'edit' ? 'Edit Product' : 'Product Details'}
                            </h2>
                        </div>

                        <div className="p-6">
                            {(modalMode === 'edit' || modalMode === 'add') ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                            <select
                                                required
                                                value={formData.categoryId}
                                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map((cat: any) => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            required
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.discountPrice}
                                                onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={formData.stock}
                                                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                            <div className="flex items-center gap-4 mt-2">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        checked={formData.isVeg}
                                                        onChange={() => setFormData({ ...formData, isVeg: true })}
                                                        className="text-green-600 focus:ring-green-500"
                                                    />
                                                    <span>Veg</span>
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        checked={!formData.isVeg}
                                                        onChange={() => setFormData({ ...formData, isVeg: false })}
                                                        className="text-red-600 focus:ring-red-500"
                                                    />
                                                    <span>Non-Veg</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                                        <div className="space-y-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                            {formData.image && (
                                                <div className="relative h-40 w-full rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                                    <img
                                                        src={formData.image}
                                                        alt="Preview"
                                                        className="w-full h-full object-contain"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, image: '' })}
                                                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                        >
                                            {modalMode === 'add' ? 'Add Product' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                // View Mode
                                selectedProduct && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600">Product Name</p>
                                                <p className="text-sm font-medium text-gray-900">{selectedProduct.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Category</p>
                                                <p className="text-sm font-medium text-gray-900">{selectedProduct.category?.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Price</p>
                                                <p className="text-sm font-medium text-gray-900">₹{selectedProduct.price}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Stock</p>
                                                <p className="text-sm font-medium text-gray-900">{selectedProduct.stockQuantity}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Type</p>
                                                <p className={`text-sm font-medium ${selectedProduct.isVeg ? 'text-green-600' : 'text-red-600'}`}>
                                                    {selectedProduct.isVeg ? 'Veg' : 'Non-Veg'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Rating</p>
                                                <p className="text-sm font-medium text-gray-900">⭐ {selectedProduct.rating || 'New'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Description</p>
                                            <p className="text-sm font-medium text-gray-900">{selectedProduct.description}</p>
                                        </div>

                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                onClick={() => setShowModal(false)}
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                            >
                                                Close
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal('edit', selectedProduct)}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
