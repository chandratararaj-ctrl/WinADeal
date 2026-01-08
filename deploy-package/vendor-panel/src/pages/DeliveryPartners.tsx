import { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Eye, Phone, Mail, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface DeliveryPartner {
    id: string;
    name: string;
    phone: string;
    email: string;
    vehicleType: string;
    vehicleNumber: string;
    licenseNumber: string;
    isVerified: boolean;
    isActive: boolean;
    rating: number;
    totalDeliveries: number;
    earnings: number;
    joinedDate: string;
    documents: {
        license: string;
        vehicle: string;
        aadhar: string;
    };
}

export default function DeliveryPartners() {
    const [partners, setPartners] = useState<DeliveryPartner[]>([]);
    const [filteredPartners, setFilteredPartners] = useState<DeliveryPartner[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'active'>('all');
    const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Mock data - Replace with API call
    useEffect(() => {
        const mockPartners: DeliveryPartner[] = [
            {
                id: '1',
                name: 'Rajesh Kumar',
                phone: '+919876543210',
                email: 'rajesh@example.com',
                vehicleType: 'Bike',
                vehicleNumber: 'DL01AB1234',
                licenseNumber: 'DL1234567890',
                isVerified: false,
                isActive: true,
                rating: 0,
                totalDeliveries: 0,
                earnings: 0,
                joinedDate: '2024-12-20',
                documents: {
                    license: 'https://example.com/license.jpg',
                    vehicle: 'https://example.com/vehicle.jpg',
                    aadhar: 'https://example.com/aadhar.jpg',
                },
            },
            {
                id: '2',
                name: 'Amit Singh',
                phone: '+919876543211',
                email: 'amit@example.com',
                vehicleType: 'Scooter',
                vehicleNumber: 'DL02CD5678',
                licenseNumber: 'DL9876543210',
                isVerified: true,
                isActive: true,
                rating: 4.5,
                totalDeliveries: 156,
                earnings: 45600,
                joinedDate: '2024-11-15',
                documents: {
                    license: 'https://example.com/license2.jpg',
                    vehicle: 'https://example.com/vehicle2.jpg',
                    aadhar: 'https://example.com/aadhar2.jpg',
                },
            },
        ];
        setPartners(mockPartners);
        setFilteredPartners(mockPartners);
    }, []);

    // Filter partners
    useEffect(() => {
        let filtered = partners;

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(
                (partner) =>
                    partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    partner.phone.includes(searchQuery) ||
                    partner.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter((partner) => {
                if (statusFilter === 'pending') return !partner.isVerified;
                if (statusFilter === 'verified') return partner.isVerified;
                if (statusFilter === 'active') return partner.isActive && partner.isVerified;
                return true;
            });
        }

        setFilteredPartners(filtered);
    }, [searchQuery, statusFilter, partners]);

    const handleVerify = (partnerId: string) => {
        toast.success('Delivery partner verified successfully!');
        setPartners(
            partners.map((p) =>
                p.id === partnerId ? { ...p, isVerified: true } : p
            )
        );
        setShowModal(false);
    };

    const handleReject = (partnerId: string) => {
        toast.error('Delivery partner rejected');
        setPartners(partners.filter((p) => p.id !== partnerId));
        setShowModal(false);
    };

    const handleToggleActive = (partnerId: string) => {
        const partner = partners.find((p) => p.id === partnerId);
        setPartners(
            partners.map((p) =>
                p.id === partnerId ? { ...p, isActive: !p.isActive } : p
            )
        );
        toast.success(`Partner ${partner?.isActive ? 'deactivated' : 'activated'} successfully`);
    };

    const stats = {
        total: partners.length,
        pending: partners.filter((p) => !p.isVerified).length,
        verified: partners.filter((p) => p.isVerified).length,
        active: partners.filter((p) => p.isActive && p.isVerified).length,
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Delivery Partners</h1>
                <p className="text-gray-600 mt-1">Manage and verify delivery partners</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Partners</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending Verification</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-lg">
                            <Filter className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Verified</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.verified}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Partners</p>
                            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.active}</p>
                        </div>
                        <div className="bg-indigo-100 p-3 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-indigo-600" />
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
                                placeholder="Search by name, phone, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        {['all', 'pending', 'verified', 'active'].map((status) => (
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

            {/* Partners Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Partner
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vehicle
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stats
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPartners.map((partner) => (
                                <tr key={partner.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                                            <div className="text-sm text-gray-500">ID: {partner.id}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 flex items-center gap-1">
                                            <Phone className="w-4 h-4" />
                                            {partner.phone}
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center gap-1">
                                            <Mail className="w-4 h-4" />
                                            {partner.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{partner.vehicleType}</div>
                                        <div className="text-sm text-gray-500">{partner.vehicleNumber}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">⭐ {partner.rating.toFixed(1)}</div>
                                        <div className="text-sm text-gray-500">{partner.totalDeliveries} deliveries</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${partner.isVerified
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                            >
                                                {partner.isVerified ? 'Verified' : 'Pending'}
                                            </span>
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${partner.isActive
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {partner.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedPartner(partner);
                                                    setShowModal(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(partner.id)}
                                                className={`${partner.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                                                    }`}
                                            >
                                                {partner.isActive ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Partner Detail Modal */}
            {showModal && selectedPartner && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Delivery Partner Details</h2>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Personal Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Name</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedPartner.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Phone</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedPartner.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedPartner.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Joined Date</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedPartner.joinedDate}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Vehicle Type</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedPartner.vehicleType}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Vehicle Number</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedPartner.vehicleNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">License Number</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedPartner.licenseNumber}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Documents</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-2">License</p>
                                        <div className="bg-gray-100 h-32 rounded-lg flex items-center justify-center">
                                            <p className="text-sm text-gray-500">Document Preview</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-2">Vehicle RC</p>
                                        <div className="bg-gray-100 h-32 rounded-lg flex items-center justify-center">
                                            <p className="text-sm text-gray-500">Document Preview</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-2">Aadhar</p>
                                        <div className="bg-gray-100 h-32 rounded-lg flex items-center justify-center">
                                            <p className="text-sm text-gray-500">Document Preview</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Close
                            </button>
                            {!selectedPartner.isVerified && (
                                <>
                                    <button
                                        onClick={() => handleReject(selectedPartner.id)}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleVerify(selectedPartner.id)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Verify & Approve
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
