import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Ticket, Calendar, DollarSign, Percent, X } from 'lucide-react';
import { couponService } from '../services/coupon.service';
import type { Coupon } from '../services/coupon.service';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Coupons() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minOrderValue: '0',
        maxDiscount: '',
        validFrom: '',
        validTo: '',
        usageLimit: '',
        isActive: true
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const data = await couponService.getAll();
            setCoupons(data);
        } catch (error) {
            toast.error('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                ...formData,
                discountValue: Number(formData.discountValue),
                minOrderValue: Number(formData.minOrderValue),
                maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
                usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined
            };

            if (editingCoupon) {
                await couponService.update(editingCoupon.id, payload);
                toast.success('Coupon updated');
            } else {
                await couponService.create(payload);
                toast.success('Coupon created');
            }
            closeModal();
            fetchCoupons();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await couponService.delete(id);
            toast.success('Coupon deleted');
            fetchCoupons();
        } catch (error) {
            toast.error('Failed to delete coupon');
        }
    };

    const openModal = (coupon?: Coupon) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue.toString(),
                minOrderValue: coupon.minOrderValue.toString(),
                maxDiscount: coupon.maxDiscount?.toString() || '',
                validFrom: new Date(coupon.validFrom).toISOString().slice(0, 16),
                validTo: new Date(coupon.validTo).toISOString().slice(0, 16),
                usageLimit: coupon.usageLimit?.toString() || '',
                isActive: coupon.isActive
            });
        } else {
            setEditingCoupon(null);
            setFormData({
                code: '',
                discountType: 'PERCENTAGE',
                discountValue: '',
                minOrderValue: '0',
                maxDiscount: '',
                validFrom: new Date().toISOString().slice(0, 16),
                validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // +7 days
                usageLimit: '',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCoupon(null);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Coupons & Discounts</h1>
                    <p className="text-gray-500">Manage platform-wide promo codes</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus size={20} /> Create Coupon
                </button>
            </div>

            {/* Coupons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => (
                    <div key={coupon.id} className={`relative bg-white rounded-xl shadow-sm border p-6 overflow-hidden transition-all hover:shadow-md ${!coupon.isActive ? 'opacity-75 bg-gray-50' : 'border-indigo-50'}`}>
                        {/* Background Decoration */}
                        <div className="absolute -right-6 -top-6 text-gray-50 opacity-50 rotate-12">
                            <Ticket size={120} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-mono font-bold tracking-widest border border-indigo-100 border-dashed">
                                    {coupon.code}
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                    {coupon.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="mb-4">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-gray-900">
                                        {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                                    </span>
                                    <span className="text-lg font-medium text-gray-500">OFF</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Min Order: ₹{coupon.minOrderValue}
                                    {coupon.maxDiscount && ` • Max Disc: ₹${coupon.maxDiscount}`}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-4">
                                <Calendar size={14} />
                                <span>{new Date(coupon.validTo).toLocaleDateString()}</span>
                                <span className="flex-1"></span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openModal(coupon)}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(coupon.id)}
                                        className="p-1 hover:bg-red-50 rounded text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {coupons.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Ticket size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No coupons found. Create your first one!</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="input-field font-mono uppercase tracking-widest"
                                    placeholder="SUMMER50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={formData.discountType}
                                        onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                                        className="input-field"
                                    >
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="FLAT">Flat Amount (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            required
                                            value={formData.discountValue}
                                            onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                                            className="input-field pl-8"
                                            placeholder="0"
                                        />
                                        <div className="absolute left-3 top-2.5 text-gray-400">
                                            {formData.discountType === 'PERCENTAGE' ? <Percent size={16} /> : <DollarSign size={16} />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.minOrderValue}
                                        onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.maxDiscount}
                                        onChange={e => setFormData({ ...formData, maxDiscount: e.target.value })}
                                        className="input-field"
                                        placeholder="Optional"
                                        disabled={formData.discountType === 'FLAT'}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.validFrom}
                                        onChange={e => setFormData({ ...formData, validFrom: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.validTo}
                                        onChange={e => setFormData({ ...formData, validTo: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">Is Active</span>
                                </label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                                >
                                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
