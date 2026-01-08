import React, { useState, useEffect } from 'react';
import { commissionService, type CommissionHistoryRecord, type DefaultRates } from '../services/commission.service';
import { toast } from 'react-hot-toast';
import { Percent, History, TrendingUp, Users, Bike, Search } from 'lucide-react';
import api from '../services/api';

interface Shop {
    id: string;
    name: string;
    commissionRate: number;
    user: { name: string; phone: string };
}

interface DeliveryPartner {
    id: string;
    commissionRate: number;
    user: { name: string; phone: string };
    vehicleType: string;
}

export default function CommissionSettings() {
    const [defaultRates, setDefaultRates] = useState<DefaultRates | null>(null);
    const [shops, setShops] = useState<Shop[]>([]);
    const [partners, setPartners] = useState<DeliveryPartner[]>([]);
    const [history, setHistory] = useState<CommissionHistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'vendors' | 'delivery' | 'history'>('vendors');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newRate, setNewRate] = useState<number>(0);
    const [reason, setReason] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ratesData, historyData] = await Promise.all([
                commissionService.getDefaultRates(),
                commissionService.getCommissionHistory({ limit: 50 })
            ]);
            setDefaultRates(ratesData);
            setHistory(historyData.history);

            // Fetch shops and partners using the configured api service
            const shopsResponse = await api.get('/shops');
            setShops(shopsResponse.data.data?.shops || []);

            const partnersResponse = await api.get('/delivery/');
            setPartners(partnersResponse.data.data?.partners || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load commission data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateVendorCommission = async (shopId: string) => {
        if (newRate < 0 || newRate > 100) {
            toast.error('Commission rate must be between 0 and 100');
            return;
        }

        try {
            await commissionService.updateVendorCommission(shopId, newRate, reason);
            toast.success('Vendor commission rate updated successfully');
            setEditingId(null);
            setNewRate(0);
            setReason('');
            fetchData();
        } catch (error) {
            toast.error('Failed to update commission rate');
        }
    };

    const handleUpdatePartnerCommission = async (partnerId: string) => {
        if (newRate < 0 || newRate > 100) {
            toast.error('Commission rate must be between 0 and 100');
            return;
        }

        try {
            await commissionService.updateDeliveryPartnerCommission(partnerId, newRate, reason);
            toast.success('Delivery partner commission rate updated successfully');
            setEditingId(null);
            setNewRate(0);
            setReason('');
            fetchData();
        } catch (error) {
            toast.error('Failed to update commission rate');
        }
    };

    const filteredShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPartners = partners.filter(partner =>
        partner.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.user.phone.includes(searchTerm)
    );

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Commission Settings</h1>
            </div>

            {/* Default Rates Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                            <Users size={24} />
                        </div>
                        <TrendingUp size={20} className="opacity-75" />
                    </div>
                    <h3 className="text-sm font-medium opacity-90 mb-1">Vendor Commission</h3>
                    <p className="text-3xl font-bold mb-2">{defaultRates?.vendor.default}%</p>
                    <p className="text-sm opacity-75">Platform Average: {defaultRates?.vendor.average.toFixed(1)}%</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                            <Bike size={24} />
                        </div>
                        <TrendingUp size={20} className="opacity-75" />
                    </div>
                    <h3 className="text-sm font-medium opacity-90 mb-1">Delivery Partner Commission</h3>
                    <p className="text-3xl font-bold mb-2">{defaultRates?.deliveryPartner.default}%</p>
                    <p className="text-sm opacity-75">Platform Average: {defaultRates?.deliveryPartner.average.toFixed(1)}%</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-200 flex items-center px-4">
                    <button
                        onClick={() => setActiveTab('vendors')}
                        className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'vendors'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Vendor Rates
                    </button>
                    <button
                        onClick={() => setActiveTab('delivery')}
                        className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'delivery'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Delivery Partner Rates
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Change History
                    </button>
                </div>

                {/* Search Bar */}
                {activeTab !== 'history' && (
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab === 'vendors' ? 'vendors' : 'delivery partners'}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                )}

                {/* Vendor Rates Table */}
                {activeTab === 'vendors' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Shop Name</th>
                                    <th className="px-6 py-4">Owner</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Commission Rate</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                                    </tr>
                                ) : filteredShops.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No vendors found</td>
                                    </tr>
                                ) : (
                                    filteredShops.map((shop) => (
                                        <tr key={shop.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-800">{shop.name}</td>
                                            <td className="px-6 py-4">{shop.user.name}</td>
                                            <td className="px-6 py-4">{shop.user.phone}</td>
                                            <td className="px-6 py-4">
                                                {editingId === shop.id ? (
                                                    <input
                                                        type="number"
                                                        value={newRate}
                                                        onChange={(e) => setNewRate(Number(e.target.value))}
                                                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                    />
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                                                        <Percent size={14} className="mr-1" />
                                                        {shop.commissionRate}%
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {editingId === shop.id ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Reason (optional)"
                                                            value={reason}
                                                            onChange={(e) => setReason(e.target.value)}
                                                            className="w-40 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateVendorCommission(shop.id)}
                                                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingId(null);
                                                                setNewRate(0);
                                                                setReason('');
                                                            }}
                                                            className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 transition"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(shop.id);
                                                            setNewRate(shop.commissionRate);
                                                        }}
                                                        className="px-4 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition"
                                                    >
                                                        Edit Rate
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Delivery Partner Rates Table */}
                {activeTab === 'delivery' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Partner Name</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Vehicle</th>
                                    <th className="px-6 py-4">Commission Rate</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                                    </tr>
                                ) : filteredPartners.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No delivery partners found</td>
                                    </tr>
                                ) : (
                                    filteredPartners.map((partner) => (
                                        <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-800">{partner.user.name}</td>
                                            <td className="px-6 py-4">{partner.user.phone}</td>
                                            <td className="px-6 py-4 capitalize">{partner.vehicleType}</td>
                                            <td className="px-6 py-4">
                                                {editingId === partner.id ? (
                                                    <input
                                                        type="number"
                                                        value={newRate}
                                                        onChange={(e) => setNewRate(Number(e.target.value))}
                                                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                    />
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                                                        <Percent size={14} className="mr-1" />
                                                        {partner.commissionRate}%
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {editingId === partner.id ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Reason (optional)"
                                                            value={reason}
                                                            onChange={(e) => setReason(e.target.value)}
                                                            className="w-40 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                        <button
                                                            onClick={() => handleUpdatePartnerCommission(partner.id)}
                                                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingId(null);
                                                                setNewRate(0);
                                                                setReason('');
                                                            }}
                                                            className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 transition"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(partner.id);
                                                            setNewRate(partner.commissionRate);
                                                        }}
                                                        className="px-4 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition"
                                                    >
                                                        Edit Rate
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* History Table */}
                {activeTab === 'history' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Entity</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Old Rate</th>
                                    <th className="px-6 py-4">New Rate</th>
                                    <th className="px-6 py-4">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                                    </tr>
                                ) : history.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No commission changes yet</td>
                                    </tr>
                                ) : (
                                    history.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                {new Date(record.createdAt).toLocaleDateString()}
                                                <div className="text-xs text-gray-400">
                                                    {new Date(record.createdAt).toLocaleTimeString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-800">{record.entityName}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${record.entityType === 'VENDOR'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {record.entityType === 'VENDOR' ? 'Vendor' : 'Delivery Partner'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-red-600 font-medium">{record.oldRate}%</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-green-600 font-medium">{record.newRate}%</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{record.reason || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
