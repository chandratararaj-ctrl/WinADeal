import { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon, DollarSign, ShoppingBag, Phone, Mail, Clock, X, ChevronRight, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsService } from '../services/settings.service';
import type { PlatformSettings, SettingHistoryItem } from '../services/settings.service';
import { format } from 'date-fns';

export default function Settings() {
    const [settings, setSettings] = useState<PlatformSettings>({
        platformName: 'WinADeal',
        currency: 'INR',
        taxRate: 5,
        baseFee: 20,
        perKmFee: 10,
        platformCommission: 10,
        baseDistance: 2,
        maxDeliveryRadius: 10,
        supportEmail: 'support@winadeal.com',
        supportPhone: '+91 1234567890',
        minOrderValue: 100
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // History Modal State
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<SettingHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await settingsService.getDeliverySettings();
            if (data) {
                setSettings(data);
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
            toast.error('Failed to load platform settings');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        if (history.length > 0) return; // cache slightly?
        try {
            setHistoryLoading(true);
            const data = await settingsService.getSettingHistory();
            setHistory(data);
        } catch (error) {
            console.error('Failed to fetch history', error);
            toast.error('Failed to load history');
        } finally {
            setHistoryLoading(false);
        }
    };

    const openHistory = () => {
        setShowHistory(true);
        fetchHistory();
    };

    const handleChange = (field: keyof PlatformSettings, value: string | number) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await settingsService.updateDeliverySettings(settings);
            toast.success('Settings saved successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading settings...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <SettingsIcon className="w-8 h-8 text-primary-600" />
                        Platform Settings
                    </h1>
                    <p className="text-gray-600 mt-1">Manage your platform configuration and preferences</p>
                </div>
                <button
                    onClick={openHistory}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    <Clock className="w-4 h-4" />
                    Change History
                </button>
            </div>

            {/* General Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-gray-600" />
                    General Settings
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Platform Name
                        </label>
                        <input
                            type="text"
                            value={settings.platformName}
                            onChange={(e) => handleChange('platformName', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Currency
                        </label>
                        <select
                            value={settings.currency}
                            onChange={(e) => handleChange('currency', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        >
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Commission & Fees */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Commission & Fees
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Platform Commission (%)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={settings.platformCommission}
                                onChange={(e) => handleChange('platformCommission', parseFloat(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Percentage of delivery fee retained by platform
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tax Rate (%)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={settings.taxRate}
                                onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Order Value (₹)
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={settings.minOrderValue}
                            onChange={(e) => handleChange('minOrderValue', parseFloat(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Delivery Charge Configuration */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                    Delivery Configuration
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Base Delivery Fee (₹)
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={settings.baseFee}
                            onChange={(e) => handleChange('baseFee', parseFloat(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Base Distance (km)
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={settings.baseDistance}
                            onChange={(e) => handleChange('baseDistance', parseFloat(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Per km Fee (₹)
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={settings.perKmFee}
                            onChange={(e) => handleChange('perKmFee', parseFloat(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Radius (km)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={settings.maxDeliveryRadius}
                                onChange={(e) => handleChange('maxDeliveryRadius', parseFloat(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">km</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Support Contact */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-purple-600" />
                    Support Contact
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Support Email
                        </label>
                        <input
                            type="email"
                            value={settings.supportEmail}
                            onChange={(e) => handleChange('supportEmail', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Support Phone
                        </label>
                        <input
                            type="tel"
                            value={settings.supportPhone}
                            onChange={(e) => handleChange('supportPhone', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="sticky bottom-6 flex justify-end gap-4 z-10">
                <button
                    onClick={() => fetchSettings()}
                    className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
                >
                    Reset
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-gray-600" />
                                Setting History
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-0 overflow-y-auto flex-1">
                            {historyLoading ? (
                                <div className="p-8 text-center text-gray-500">Loading history...</div>
                            ) : history.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No history available</div>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {history.map((item) => (
                                        <li key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-medium text-gray-900 text-sm bg-gray-100 px-2 py-1 rounded">
                                                    {item.key.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {format(new Date(item.createdAt), 'PP p')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm mt-2">
                                                <span className="text-red-500 line-through bg-red-50 px-2 py-0.5 rounded">
                                                    {item.oldValue ?? 'None'}
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                                <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">
                                                    {item.newValue}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                                <User className="w-3 h-3" />
                                                Changed by: <span className="font-medium text-gray-700">{item.user?.name || item.changedBy}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
                            <button onClick={() => setShowHistory(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
