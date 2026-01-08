import React, { useState } from 'react';
import { Volume2, VolumeX, Bell, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import soundService from '../services/soundNotification.service';
import toast from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { StatCardSkeleton, TableSkeleton, ProductGridSkeleton, DashboardSkeleton } from '../components/Skeletons';

const TestFeatures: React.FC = () => {
    const [soundEnabled, setSoundEnabled] = useState(soundService.getSettings().enabled);
    const [volume, setVolume] = useState(soundService.getSettings().volume);
    const [showSkeletons, setShowSkeletons] = useState(false);

    const handleToggleSound = () => {
        const newEnabled = !soundEnabled;
        setSoundEnabled(newEnabled);
        soundService.setEnabled(newEnabled);
        toast.success(newEnabled ? 'Sound notifications enabled' : 'Sound notifications disabled');
    };

    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        soundService.setVolume(newVolume);
    };

    const testSounds = [
        { name: 'New Order', fn: () => soundService.playNewOrderSound(), icon: Bell },
        { name: 'Order Accepted', fn: () => soundService.playOrderAcceptedSound(), icon: CheckCircle },
        { name: 'Order Completed', fn: () => soundService.playOrderCompletedSound(), icon: CheckCircle },
        { name: 'Error/Cancelled', fn: () => soundService.playErrorSound(), icon: XCircle },
    ];

    const testToasts = [
        { name: 'Success', fn: () => toast.success('Operation successful!'), color: 'green' },
        { name: 'Error', fn: () => toast.error('Something went wrong!'), color: 'red' },
        { name: 'Warning', fn: () => toast.warning('Please be careful!'), color: 'amber' },
        { name: 'Info', fn: () => toast.info('Here is some information'), color: 'blue' },
        { name: 'Loading', fn: () => toast.loading('Processing...'), color: 'indigo' },
        { name: 'New Order', fn: () => toast.order.newOrder('ORD-12345'), color: 'green' },
        { name: 'Shop Opened', fn: () => toast.vendor.shopOpened(), color: 'green' },
        { name: 'Low Stock', fn: () => toast.vendor.lowStock('Pizza Margherita', 5), color: 'amber' },
    ];

    return (
        <div className="space-y-8 p-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 Feature Testing Dashboard</h1>
                <p className="text-gray-600">Test all Phase 1 enhancements</p>
            </div>

            {/* Sound Notifications Section */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Volume2 className="w-6 h-6 text-indigo-600" />
                            Sound Notifications
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Test audio alerts for orders</p>
                    </div>
                    <button
                        onClick={handleToggleSound}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${soundEnabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        {soundEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                </div>

                {/* Volume Control */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Volume: {Math.round(volume * 100)}%
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Sound Test Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {testSounds.map((sound, index) => (
                        <button
                            key={index}
                            onClick={sound.fn}
                            disabled={!soundEnabled}
                            className="flex flex-col items-center gap-2 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <sound.icon className="w-6 h-6 text-indigo-600" />
                            <span className="text-sm font-medium text-gray-900">{sound.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Toast Notifications Section */}
            <div className="card">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="w-6 h-6 text-indigo-600" />
                        Toast Notifications
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Test different notification types</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {testToasts.map((toastTest, index) => (
                        <button
                            key={index}
                            onClick={toastTest.fn}
                            className={`p-4 bg-${toastTest.color}-50 hover:bg-${toastTest.color}-100 rounded-lg transition-colors`}
                        >
                            <span className="text-sm font-medium text-gray-900">{toastTest.name}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <Info className="w-4 h-4 inline mr-2" />
                        Notifications will appear in the top-right corner
                    </p>
                </div>
            </div>

            {/* Loading States Section */}
            <div className="card">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Loading States & Skeletons</h2>
                    <p className="text-sm text-gray-600 mt-1">Test loading indicators</p>
                </div>

                <div className="space-y-6">
                    {/* Loading Spinners */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Loading Spinners</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg">
                                <LoadingSpinner size="sm" />
                                <span className="text-sm text-gray-600">Small</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg">
                                <LoadingSpinner size="md" />
                                <span className="text-sm text-gray-600">Medium</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg">
                                <LoadingSpinner size="lg" />
                                <span className="text-sm text-gray-600">Large</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg">
                                <LoadingSpinner size="xl" />
                                <span className="text-sm text-gray-600">Extra Large</span>
                            </div>
                        </div>
                    </div>

                    {/* Skeleton Toggle */}
                    <div>
                        <button
                            onClick={() => setShowSkeletons(!showSkeletons)}
                            className="btn-primary mb-4"
                        >
                            {showSkeletons ? 'Hide' : 'Show'} Skeleton Loaders
                        </button>

                        {showSkeletons && (
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-md font-semibold text-gray-900 mb-3">Stat Cards</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <StatCardSkeleton />
                                        <StatCardSkeleton />
                                        <StatCardSkeleton />
                                        <StatCardSkeleton />
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-md font-semibold text-gray-900 mb-3">Table</h4>
                                    <TableSkeleton rows={5} columns={6} />
                                </div>

                                <div>
                                    <h4 className="text-md font-semibold text-gray-900 mb-3">Product Grid</h4>
                                    <ProductGridSkeleton count={4} />
                                </div>

                                <div>
                                    <h4 className="text-md font-semibold text-gray-900 mb-3">Full Dashboard</h4>
                                    <DashboardSkeleton />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Boundary Test */}
            <div className="card">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        Error Boundary
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Error boundaries are active across the app</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Error boundary is wrapping the entire application. Any React errors will be caught gracefully.
                    </p>
                </div>
            </div>

            {/* WebSocket Status */}
            <div className="card">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">WebSocket Connection</h2>
                    <p className="text-sm text-gray-600 mt-1">Real-time updates status</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <Info className="w-4 h-4 inline mr-2" />
                        WebSocket service is initialized with automatic reconnection. Check console for connection status.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TestFeatures;
