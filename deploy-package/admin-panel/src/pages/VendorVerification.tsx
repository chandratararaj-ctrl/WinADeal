import React, { useState } from 'react';
import {
    Store,
    MapPin,
    Phone,
    Mail,
    FileText,
    CheckCircle,
    XCircle,
    Eye,
    Download,
    Clock,
    AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllVendors, getAllVendorUsers, approveVendor, rejectVendor } from '../services/vendor.service';

interface Vendor {
    id: string;
    name: string;
    ownerName: string;
    phone: string;
    email: string;
    address: string;
    category: string;
    gstin: string;
    fssaiNumber?: string;
    documents: {
        type: string;
        url: string;
        status: 'pending' | 'approved' | 'rejected';
    }[];
    status: 'pending' | 'approved' | 'rejected' | 'registered';
    submittedAt: string;
    rejectionReason?: string;
}

const VendorVerification: React.FC = () => {
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [filterStatus, setFilterStatus] = useState('all');

    // Rejection state
    const [rejectMode, setRejectMode] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    React.useEffect(() => {
        loadVendors();
    }, []);

    const loadVendors = async () => {
        try {
            const [shops, users]: [any[], any[]] = await Promise.all([
                getAllVendors(),
                getAllVendorUsers()
            ]);

            // Map shops to Vendors
            const mappedShops: Vendor[] = shops.map(shop => ({
                id: shop.id,
                name: shop.name,
                ownerName: shop.user?.name || 'Unknown',
                phone: shop.user?.phone || shop.phone || 'N/A',
                email: shop.user?.email || shop.email || 'N/A',
                address: shop.address,
                category: shop.category?.name || 'General',
                gstin: shop.gstin || 'N/A',
                fssaiNumber: shop.fssaiNumber,
                documents: shop.user?.documents?.map((doc: any) => ({
                    type: doc.type,
                    url: doc.fileUrl,
                    status: doc.status.toLowerCase(),
                })) || [],
                status: shop.isVerified ? 'approved' : (shop.rejectionReason ? 'rejected' : 'pending'),
                submittedAt: shop.createdAt || new Date().toISOString(),
                rejectionReason: shop.rejectionReason,
            }));

            // Find users who haven't created a shop yet
            const shopUserIds = new Set(shops.map(s => s.userId));
            const pendingUsers: Vendor[] = users
                .filter(user => !shopUserIds.has(user.id))
                .map(user => ({
                    id: user.id,
                    name: 'Shop Not Set Up',
                    ownerName: user.name,
                    phone: user.phone,
                    email: user.email || 'N/A',
                    address: 'Pending Setup',
                    category: 'N/A',
                    gstin: 'N/A',
                    documents: [],
                    status: 'registered',
                    submittedAt: user.createdAt,
                }));

            setVendors([...mappedShops, ...pendingUsers]);
        } catch (error) {
            console.error('Failed to load vendors:', error);
            toast.error('Failed to load vendors');
        }
    };

    const handleApprove = async (vendorId: string) => {
        try {
            await approveVendor(vendorId);
            // Update local state
            setVendors(vendors.map(v =>
                v.id === vendorId ? { ...v, status: 'approved', rejectionReason: undefined } : v
            ));
            toast.success('Vendor approved successfully!');
            closeModal();
        } catch (error) {
            toast.error('Failed to approve vendor');
        }
    };

    const handleReject = async (vendorId: string) => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        try {
            await rejectVendor(vendorId, rejectionReason);
            setVendors(vendors.map(v =>
                v.id === vendorId ? { ...v, status: 'rejected', rejectionReason } : v
            ));
            toast.success('Vendor rejected successfully');
            closeModal();
        } catch (error) {
            toast.error('Failed to reject vendor');
        }
    };

    const openVendorModal = (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setRejectMode(false);
        setRejectionReason('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setRejectMode(false);
        setRejectionReason('');
        setSelectedVendor(null);
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { class: string; text: string }> = {
            registered: { class: 'bg-indigo-100 text-indigo-700', text: 'Registered' },
            pending: { class: 'badge-warning', text: 'Pending' },
            approved: { class: 'badge-success', text: 'Approved' },
            rejected: { class: 'badge-danger', text: 'Rejected' },
        };
        const badge = badges[status] || badges.pending;
        return <span className={`badge ${badge.class || ''}`}>{badge.text}</span>;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Vendor Verification</h1>
                    <p className="text-gray-600 mt-1">Review and approve vendor registrations</p>
                </div>
                <div className="flex items-center space-x-4">
                    <select
                        className="input"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="registered">Registered (No Shop)</option>
                        <option value="pending">Pending Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                    <div className="flex items-center space-x-4">
                        <div className="bg-amber-100 p-3 rounded-lg">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {vendors.filter(v => v.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-4">
                        <div className="bg-green-100 p-3 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Approved</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {vendors.filter(v => v.status === 'approved').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-4">
                        <div className="bg-red-100 p-3 rounded-lg">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Rejected</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {vendors.filter(v => v.status === 'rejected').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vendors List */}
            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Shop Name</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Owner</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Submitted</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors
                                .filter(v => filterStatus === 'all' || v.status === filterStatus)
                                .map((vendor) => (
                                    <tr key={vendor.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="bg-primary-100 p-2 rounded-lg">
                                                    <Store className="w-5 h-5 text-primary-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{vendor.name}</p>
                                                    <p className="text-xs text-gray-500">{vendor.gstin}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-700">{vendor.ownerName}</td>
                                        <td className="py-4 px-4 text-sm text-gray-700">{vendor.category}</td>
                                        <td className="py-4 px-4">
                                            <div className="text-sm text-gray-700">
                                                <p className="flex items-center">
                                                    <Phone className="w-3 h-3 mr-1" />
                                                    {vendor.phone}
                                                </p>
                                                <p className="flex items-center text-xs text-gray-500">
                                                    <Mail className="w-3 h-3 mr-1" />
                                                    {vendor.email}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-500">{formatDate(vendor.submittedAt)}</td>
                                        <td className="py-4 px-4">{getStatusBadge(vendor.status)}</td>
                                        <td className="py-4 px-4">
                                            <button
                                                onClick={() => openVendorModal(vendor)}
                                                className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span>Review</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vendor Details Modal */}
            {showModal && selectedVendor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Vendor Details</h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Rejection Alert */}
                            {selectedVendor.status === 'rejected' && selectedVendor.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">Shop Rejected</h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                <p>Reason: {selectedVendor.rejectionReason}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Basic Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-600">Shop Name</label>
                                        <p className="text-base font-medium text-gray-900">{selectedVendor.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">Owner Name</label>
                                        <p className="text-base font-medium text-gray-900">{selectedVendor.ownerName}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">Phone</label>
                                        <p className="text-base font-medium text-gray-900">{selectedVendor.phone}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">Email</label>
                                        <p className="text-base font-medium text-gray-900">{selectedVendor.email}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-sm text-gray-600">Address</label>
                                        <p className="text-base font-medium text-gray-900 flex items-start">
                                            <MapPin className="w-4 h-4 mr-1 mt-1 flex-shrink-0" />
                                            {selectedVendor.address}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">Category</label>
                                        <p className="text-base font-medium text-gray-900">{selectedVendor.category}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">GSTIN</label>
                                        <p className="text-base font-medium text-gray-900">{selectedVendor.gstin}</p>
                                    </div>
                                    {selectedVendor.fssaiNumber && (
                                        <div>
                                            <label className="text-sm text-gray-600">FSSAI Number</label>
                                            <p className="text-base font-medium text-gray-900">{selectedVendor.fssaiNumber}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Documents */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                                <div className="space-y-3">
                                    {selectedVendor.documents.map((doc, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <FileText className="w-5 h-5 text-gray-400" />
                                                <span className="text-sm font-medium text-gray-900">{doc.type}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => window.open(doc.url, '_blank')}
                                                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                                                    title="View Document"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const link = document.createElement('a');
                                                        link.href = doc.url;
                                                        link.download = doc.type + '-' + selectedVendor.name;
                                                        link.click();
                                                    }}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                    title="Download Document"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedVendor.documents.length === 0 && (
                                        <p className="text-gray-500 italic">No documents uploaded.</p>
                                    )}
                                </div>
                            </div>

                            {/* Actions / Rejection Form */}
                            {selectedVendor.status === 'pending' && (
                                <div className="flex flex-col space-y-4 pt-4 border-t border-gray-200">
                                    {rejectMode ? (
                                        <div className="bg-red-50 p-4 rounded-lg space-y-3">
                                            <label className="block text-sm font-medium text-red-900">Reason for Rejection</label>
                                            <textarea
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                placeholder="Please explain why the vendor is being rejected..."
                                                className="w-full h-24 p-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500"
                                            />
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => setRejectMode(false)}
                                                    className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleReject(selectedVendor.id)}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                                >
                                                    Confirm Reject
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-end space-x-4">
                                            <button
                                                onClick={() => setRejectMode(true)}
                                                className="btn-danger flex items-center space-x-2"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                <span>Reject</span>
                                            </button>
                                            <button
                                                onClick={() => handleApprove(selectedVendor.id)}
                                                className="btn-primary flex items-center space-x-2"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Approve Vendor</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default VendorVerification;
