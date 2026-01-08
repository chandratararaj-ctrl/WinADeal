import React, { useState, useEffect } from 'react';
import { payoutService } from '../services/payout.service';
import type { Payout, PayoutStats, VendorBalance, DeliveryPartnerBalance } from '../services/payout.service';
import { toast } from 'react-hot-toast';
import {
    Clock,
    CheckCircle,
    Briefcase,
    Building2,
    Bike,
    ChevronRight,
    Search,
    Download
} from 'lucide-react';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

export default function Payouts() {
    const [stats, setStats] = useState<PayoutStats | null>(null);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [vendorBalances, setVendorBalances] = useState<VendorBalance[]>([]);
    const [deliveryBalances, setDeliveryBalances] = useState<DeliveryPartnerBalance[]>([]);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'REQUESTS' | 'HISTORY' | 'VENDOR_REPORT' | 'DELIVERY_REPORT'>('REQUESTS');

    const [processingId, setProcessingId] = useState<string | null>(null);
    const [transactionRef, setTransactionRef] = useState('');
    const [notes, setNotes] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            // Always fetch stats
            const statsData = await payoutService.getStats();
            setStats(statsData);

            if (activeTab === 'REQUESTS') {
                const data = await payoutService.getPayouts({ status: 'PENDING' });
                setPayouts(data.payouts);
            } else if (activeTab === 'HISTORY') {
                const data = await payoutService.getPayouts({ status: 'PROCESSED' });
                setPayouts(data.payouts);
            } else if (activeTab === 'VENDOR_REPORT') {
                const data = await payoutService.getVendorBalances();
                setVendorBalances(data);
            } else if (activeTab === 'DELIVERY_REPORT') {
                const data = await payoutService.getDeliveryPartnerBalances();
                setDeliveryBalances(data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleProcess = async (id: string) => {
        setProcessingId(id);
        setTransactionRef('');
        setNotes('');
    };

    const submitProcess = async () => {
        if (!processingId) return;
        if (!transactionRef) {
            toast.error('Transaction Reference is required');
            return;
        }

        try {
            await payoutService.updatePayoutStatus(processingId, {
                status: 'PROCESSED',
                transactionRef,
                notes
            });
            toast.success('Payout processed successfully');
            setProcessingId(null);
            fetchData();
        } catch (error) {
            toast.error('Failed to process payout');
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            PENDING: 'bg-orange-100 text-orange-700',
            PROCESSED: 'bg-green-100 text-green-700',
            FAILED: 'bg-red-100 text-red-700',
            REJECTED: 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6 p-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Payouts & Finance</h1>
                    <p className="text-gray-500 text-sm">Manage commissions, payouts, and view earnings reports</p>
                </div>
                <button
                    onClick={() => toast.success('Exporting CSV... (Coming Soon)')}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                >
                    <Download size={16} />
                    Export Report
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Briefcase size={24} />
                        </div>
                        <span className="text-indigo-100 text-xs font-medium bg-white/10 px-2 py-1 rounded">Total Revenue</span>
                    </div>
                    <p className="text-sm text-indigo-100">Total Commission Earned</p>
                    <h3 className="text-3xl font-bold mt-1">{formatCurrency(stats?.commission?.amount || 0)}</h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <Clock size={24} />
                        </div>
                        <span className="text-gray-400 text-xs">Pending</span>
                    </div>
                    <p className="text-sm text-gray-500">Pending Requests</p>
                    <div className="flex items-end gap-2 mt-1">
                        <h3 className="text-3xl font-bold text-gray-800">{formatCurrency(stats?.pending.amount || 0)}</h3>
                        <span className="text-sm text-orange-600 font-medium mb-1">({stats?.pending.count || 0})</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <CheckCircle size={24} />
                        </div>
                        <span className="text-gray-400 text-xs">Completed</span>
                    </div>
                    <p className="text-sm text-gray-500">Processed Payouts</p>
                    <div className="flex items-end gap-2 mt-1">
                        <h3 className="text-3xl font-bold text-gray-800">{formatCurrency(stats?.processed.amount || 0)}</h3>
                        <span className="text-sm text-green-600 font-medium mb-1">({stats?.processed.count || 0})</span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {[
                        { id: 'REQUESTS', label: 'Payout Requests', icon: Clock },
                        { id: 'HISTORY', label: 'History', icon: CheckCircle },
                        { id: 'VENDOR_REPORT', label: 'Vendor Balances', icon: Building2 },
                        { id: 'DELIVERY_REPORT', label: 'Delivery Balances', icon: Bike },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                                    ${activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                `}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {/* PAYOUT REQUESTS & HISTORY TABLE */}
                        {(activeTab === 'REQUESTS' || activeTab === 'HISTORY') && (
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Recipient</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Method</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {payouts.length === 0 ? (
                                        <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No records found</td></tr>
                                    ) : payouts.map((payout) => (
                                        <tr key={payout.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{payout.shop ? payout.shop.name : payout.deliveryPartner?.user?.name}</p>
                                                    <p className="text-xs text-gray-400">{payout.shop ? payout.shop.user?.phone : payout.deliveryPartner?.user?.phone}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${payout.shop ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    {payout.shop ? 'VENDOR' : 'DELIVERY'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-800">{formatCurrency(payout.amount)}</td>
                                            <td className="px-6 py-4 text-xs">{payout.method}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-700">{new Date(payout.createdAt).toLocaleDateString()}</div>
                                                <div className="text-xs text-gray-400">{new Date(payout.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-6 py-4"><StatusBadge status={payout.status} /></td>
                                            <td className="px-6 py-4 text-right">
                                                {payout.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleProcess(payout.id)}
                                                        className="text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-50 transition"
                                                    >
                                                        Process
                                                    </button>
                                                )}
                                                {payout.status === 'PROCESSED' && (
                                                    <div className="text-xs text-gray-400 truncate max-w-[100px]" title={payout.transactionRef}>
                                                        #{payout.transactionRef}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* VENDOR & DELIVERY REPORT TABLE */}
                        {(activeTab === 'VENDOR_REPORT' || activeTab === 'DELIVERY_REPORT') && (
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Bank Details</th>
                                        <th className="px-6 py-4 text-right">Total Earnings</th>
                                        <th className="px-6 py-4 text-right">Total Paid</th>
                                        <th className="px-6 py-4 text-right">Pending Balance</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(activeTab === 'VENDOR_REPORT' ? vendorBalances : deliveryBalances).length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No data found</td></tr>
                                    ) : (activeTab === 'VENDOR_REPORT' ? vendorBalances : deliveryBalances).map((item: any, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.shopName || item.name}</p>
                                                    <p className="text-xs text-gray-500">{item.ownerName || item.phone}</p>
                                                    {item.shopName && <p className="text-xs text-gray-400">{item.phone}</p>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                {item.bankDetails?.account ? (
                                                    <div>
                                                        <p className="font-mono text-gray-600">{item.bankDetails.account}</p>
                                                        <p className="text-gray-400">{item.bankDetails.ifsc}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">Not Added</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-700">{formatCurrency(item.totalEarnings)}</td>
                                            <td className="px-6 py-4 text-right font-medium text-green-600">{formatCurrency(item.totalPaid)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-bold ${item.pendingBalance > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {formatCurrency(item.pendingBalance)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {item.pendingBalance > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            // For now just toast, realistically this would open a create payout modal pre-filled
                                                            toast('Auto-fill payout feature coming soon', { icon: 'ℹ️' });
                                                        }}
                                                        className="text-indigo-600 hover:underline text-xs font-medium"
                                                    >
                                                        Pay Now
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Process Modal */}
            {processingId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">Process Payout</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference ID</label>
                                <input
                                    type="text"
                                    value={transactionRef}
                                    onChange={(e) => setTransactionRef(e.target.value)}
                                    placeholder="e.g. UPI/Bank Ref No."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any internal notes..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-24"
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setProcessingId(null)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitProcess}
                                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition"
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
