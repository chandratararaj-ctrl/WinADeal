import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Eye, Package, TrendingUp, DollarSign, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { productService } from '../services/product.service';
import type { Product } from '../services/product.service';

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    // Form/Modal states
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('view');
    const [categories, setCategories] = useState<any[]>([]);
    const [shops, setShops] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        discountPrice: '',
        categoryId: '',
        shopId: '',
        stock: '',
        isVeg: true,
        image: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [productsData, categoriesData, shopsData] = await Promise.all([
                productService.getProducts({ includeInactive: true }),
                productService.getCategories(),
                productService.getShops()
            ]);
            setProducts(productsData.products);
            setCategories(categoriesData);
            setShops(shopsData);
        } catch (error) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = useCallback(async () => {
        try {
            const data = await productService.getProducts({
                search: searchQuery,
                categoryId: categoryFilter,
                includeInactive: true
            });
            setProducts(data.products);
        } catch (error) {
            console.error(error);
        }
    }, [searchQuery, categoryFilter]);

    // Refetch on filter change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, categoryFilter, fetchProducts]);

    const filteredProducts = products.filter(product => {
        if (statusFilter === 'active') return product.isAvailable;
        if (statusFilter === 'inactive') return !product.isAvailable;
        return true;
    });

    const handleToggleActive = async (product: Product) => {
        try {
            await productService.updateProduct(product.id, {
                isAvailable: !product.isAvailable
            });
            toast.success(`Product ${product.isAvailable ? 'deactivated' : 'activated'} successfully`);
            fetchProducts();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update product');
        }
    };

    const handleDelete = async (productId: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await productService.deleteProduct(productId);
                toast.success('Product deleted successfully');
                fetchProducts();
            } catch (error) {
                console.error(error);
                toast.error('Failed to delete product');
            }
        }
    };

    const handleOpenModal = (mode: 'view' | 'edit' | 'add', product?: Product) => {
        setModalMode(mode);
        setSelectedProduct(product || null);

        if (mode === 'add') {
            setFormData({
                name: '',
                description: '',
                price: '',
                discountPrice: '',
                categoryId: categories[0]?.id || '',
                shopId: shops[0]?.id || '',
                stock: '',
                isVeg: true,
                image: ''
            });
        } else if (product) {
            setFormData({
                name: product.name,
                description: product.description,
                price: String(product.price),
                discountPrice: product.discountPrice ? String(product.discountPrice) : '',
                categoryId: product.categoryId,
                shopId: product.shopId,
                stock: String(product.stockQuantity),
                isVeg: product.isVeg,
                image: product.images?.[0] || ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = {
                ...formData,
                price: Number(formData.price),
                discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
                stock: Number(formData.stock),
            };

            if (modalMode === 'add') {
                await productService.createProduct(data);
                toast.success('Product added successfully');
            } else if (selectedProduct) {
                await productService.updateProduct(selectedProduct.id, data);
                toast.success('Product updated successfully');
            }
            setShowModal(false);
            fetchProducts();
        } catch (error) {
            console.error(error);
            toast.error(`Failed to ${modalMode} product`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const stats = {
        total: products.length,
        active: products.filter((p) => p.isAvailable).length,
        outOfStock: products.filter((p) => p.stockQuantity === 0).length,
        totalRevenue: products.reduce((sum, p) => sum + (p.price * (p.totalSales || 0)), 0),
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                    <p className="text-gray-600 mt-1">Manage products across all vendors</p>
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
                                placeholder="Search products, vendors, categories..."
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
                        {categories.map((cat) => (
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
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            {/* Product Image */}
                            <div className="relative h-48 bg-gray-100">
                                {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
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
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm text-gray-600">{product.shop?.name}</p>
                                    <p className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-600">{product.category?.name}</p>
                                </div>
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
            {filteredProducts.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setCategoryFilter('all');
                            setStatusFilter('all');
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Clear Filters
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
                            {modalMode === 'view' && selectedProduct ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Product Name</p>
                                            <p className="text-base font-semibold text-gray-900">{selectedProduct.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Category</p>
                                            <p className="text-base font-medium text-gray-900">{selectedProduct.category?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Price</p>
                                            <p className="text-base font-bold text-gray-900">₹{selectedProduct.price}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Stock</p>
                                            <p className="text-base font-medium text-gray-900">{selectedProduct.stockQuantity}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Vendor</p>
                                            <p className="text-base font-medium text-gray-900">{selectedProduct.shop?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Type</p>
                                            <p className={`text-base font-medium ${selectedProduct.isVeg ? 'text-green-600' : 'text-red-600'}`}>
                                                {selectedProduct.isVeg ? 'Veg' : 'Non-Veg'}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Description</p>
                                        <p className="text-base text-gray-700 leading-relaxed">{selectedProduct.description}</p>
                                    </div>
                                    {selectedProduct.images?.[0] && (
                                        <div>
                                            <p className="text-sm text-gray-500 mb-2">Image</p>
                                            <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-full h-48 object-cover rounded-lg" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="e.g. Margherita Pizza"
                                            />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                            <select
                                                required
                                                value={formData.categoryId}
                                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price (₹)</label>
                                            <input
                                                type="number"
                                                value={formData.discountPrice}
                                                onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="Optional"
                                            />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Shop/Vendor</label>
                                            <select
                                                required
                                                disabled={modalMode === 'edit'}
                                                value={formData.shopId}
                                                onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="">Select Shop</option>
                                                {shops.map((shop) => (
                                                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.stock}
                                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <textarea
                                                required
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                                placeholder="Product details..."
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isVeg}
                                                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Vegetarian?</span>
                                            </label>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
                            <div>
                                {modalMode === 'edit' && selectedProduct && (
                                    <button
                                        onClick={() => handleDelete(selectedProduct.id)}
                                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        Delete
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    {modalMode === 'view' ? 'Close' : 'Cancel'}
                                </button>
                                {modalMode !== 'view' && (
                                    <button
                                        form="product-form"
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2"
                                    >
                                        {isSubmitting ? 'Saving...' : (modalMode === 'add' ? 'Add Product' : 'Save Changes')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
