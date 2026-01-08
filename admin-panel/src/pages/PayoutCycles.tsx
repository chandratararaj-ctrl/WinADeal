import React, { useState, useEffect } from 'react';
import { payoutCycleService, type PayoutCycle, type PendingPayoutSummary } from '../services/payout-cycle.service';
import { toast } from 'react-hot-toast';
import { Calendar, Plus, X, TrendingUp, Users, Bike, DollarSign, CheckCircle, Clock } from 'lucide-react';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

export default function PayoutCycles() {
    const [cycles, setCycles] = useState<PayoutCycle[]>([]);
    const [activeCycle, setActiveCycle] = useState<PayoutCycle | null>(null);
    const [pendingPayouts, setPendingPayouts] = useState<PendingPayoutSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [cycleType, setCycleType] = useState<'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'>('WEEKLY');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cyclesData, activeData] = await Promise.all([
                payoutCycleService.getPayoutCycles({ limit: 50 }),
                payoutCycleService.getActiveCycle().catch(() => null)
            ]);
            setCycles(cyclesData.cycles);
            setActiveCycle(activeData);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load payout cycles');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCycle = async () => {
        try {
            await payoutCycleService.createPayoutCycle({ cycleType });
            toast.success('Payout cycle created successfully');
            setShowCreateModal(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create payout cycle');
        }
    };

    const handleViewPending = async (cycleId: string) => {
        try {
            const data = await payoutCycleService.calculatePendingPayouts(cycleId);
            setPendingPayouts(data);
            setShowPendingModal(true);
        } catch (error) {
            toast.error('Failed to calculate pending payouts');
        }
    };

    const handleCloseCycle = async (cycleId: string) => {
        if (!confirm('Are you sure you want to close this cycle and generate payouts? This action cannot be undone.')) {
            return;
        }

        try {
            const result = await payoutCycleService.closePayoutCycle(cycleId);
            toast.success(`Cycle closed! ${result.payoutsGenerated} payouts generated totaling ${formatCurrency(result.totalAmount)}`);
            setShowPendingModal(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to close payout cycle');
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            ACTIVE: 'bg-green-100 text-green-700',
            CLOSED: 'bg-gray-100 text-gray-700',
            PROCESSING: 'bg-yellow-100 text-yellow-700',
            COMPLETED: 'bg-blue-100 text-blue-700'
        };
        return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Payout Cycles</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    disabled={!!activeCycle}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Plus size={20} />
                    Create New Cycle
                </button>
            </div>

            {/* Active Cycle Card */}
            {activeCycle && (
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">{activeCycle.name}</h3>
                                <p className="text-sm opacity-90">{activeCycle.cycleType} Cycle</p>
                            </div>
                        </div>
                        <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
                            ACTIVE
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-sm opacity-75">Start Date</p>
                            <p className="font-semibold">{new Date(activeCycle.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-sm opacity-75">End Date</p>
                            <p className="font-semibold">{new Date(activeCycle.endDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleViewPending(activeCycle.id)}
                            className="flex-1 px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition font-medium"
                        >
                            View Pending Payouts
                        </button>
                        <button
                            onClick={() => handleCloseCycle(activeCycle.id)}
                            className="flex-1 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium"
                        >
                            Close Cycle
                        </button>
                    </div>
                </div>
            )}

            {/* Cycles List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">All Payout Cycles</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Cycle Name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Period</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Payouts</th>
                                <th className="px-6 py-4">Total Amount</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                                </tr>
                            ) : cycles.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">No payout cycles found</td>
                                </tr>
                            ) : (
                                cycles.map((cycle) => (
                                    <tr key={cycle.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-800">{cycle.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                                {cycle.cycleType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs">
                                                <div>{new Date(cycle.startDate).toLocaleDateString()}</div>
                                                <div className="text-gray-400">to {new Date(cycle.endDate).toLocaleDateString()}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(cycle.status)}`}>
                                                {cycle.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{cycle.totalPayouts || 0}</td>
                                        <td className="px-6 py-4 font-bold text-gray-800">
                                            {formatCurrency(cycle.totalAmount || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {cycle.status === 'ACTIVE' && (
                                                <button
                                                    onClick={() => handleViewPending(cycle.id)}
                                                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition"
                                                >
                                                    View Pending
                                                </button>
                                            )}
                                            {cycle.status === 'CLOSED' && (
                                                <span className="text-xs text-gray-400">
                                                    Closed {cycle.processedAt && new Date(cycle.processedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Cycle Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">Create New Payout Cycle</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cycle Type</label>
                                <select
                                    value={cycleType}
                                    onChange={(e) => setCycleType(e.target.value as any)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                >
                                    <option value="WEEKLY">Weekly</option>
                                    <option value="BIWEEKLY">Bi-weekly</option>
                                    <option value="MONTHLY">Monthly</option>
                                </select>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Note:</strong> The cycle will start today and end based on the selected type.
                                    You can only have one active cycle at a time.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateCycle}
                                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition"
                            >
                                Create Cycle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Payouts Modal */}
            {showPendingModal && pendingPayouts && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                            <h3 className="text-lg font-bold text-gray-800">Pending Payouts - {pendingPayouts.cycle.name}</h3>
                            <button onClick={() => setShowPendingModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Summary Cards */}
                        <div className="p-6 grid grid-cols-3 gap-4 border-b border-gray-100">
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users size={20} className="text-purple-600" />
                                    <p className="text-sm font-medium text-purple-900">Vendor Payouts</p>
                                </div>
                                <p className="text-2xl font-bold text-purple-700">{pendingPayouts.vendors.count}</p>
                                <p className="text-sm text-purple-600">{formatCurrency(pendingPayouts.vendors.totalAmount)}</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Bike size={20} className="text-blue-600" />
                                    <p className="text-sm font-medium text-blue-900">Delivery Payouts</p>
                                </div>
                                <p className="text-2xl font-bold text-blue-700">{pendingPayouts.deliveryPartners.count}</p>
                                <p className="text-sm text-blue-600">{formatCurrency(pendingPayouts.deliveryPartners.totalAmount)}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign size={20} className="text-green-600" />
                                    <p className="text-sm font-medium text-green-900">Total Amount</p>
                                </div>
                                <p className="text-2xl font-bold text-green-700">{pendingPayouts.summary.totalPayouts}</p>
                                <p className="text-sm text-green-600">{formatCurrency(pendingPayouts.summary.totalAmount)}</p>
                            </div>
                        </div>

                        {/* Vendor Payouts Table */}
                        <div className="p-6">
                            <h4 className="font-semibold text-gray-800 mb-3">Vendor Payouts</h4>
                            <div className="overflow-x-auto max-h-64 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Shop</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Orders</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Net Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {pendingPayouts.vendors.payouts.map((payout, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2 font-medium text-gray-800">{payout.shopName}</td>
                                                <td className="px-4 py-2 text-right text-gray-600">{payout.orderCount}</td>
                                                <td className="px-4 py-2 text-right font-semibold text-gray-800">{formatCurrency(payout.netAmount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Delivery Partner Payouts Table */}
                        <div className="p-6 border-t border-gray-100">
                            <h4 className="font-semibold text-gray-800 mb-3">Delivery Partner Payouts</h4>
                            <div className="overflow-x-auto max-h-64 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Partner</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Deliveries</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Net Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {pendingPayouts.deliveryPartners.payouts.map((payout, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2 font-medium text-gray-800">{payout.partnerName}</td>
                                                <td className="px-4 py-2 text-right text-gray-600">{payout.deliveryCount}</td>
                                                <td className="px-4 py-2 text-right font-semibold text-gray-800">{formatCurrency(payout.netAmount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                            <button
                                onClick={() => setShowPendingModal(false)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleCloseCycle(pendingPayouts.cycle.id)}
                                className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-sm transition flex items-center gap-2"
                            >
                                <CheckCircle size={18} />
                                Close Cycle & Generate Payouts
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
