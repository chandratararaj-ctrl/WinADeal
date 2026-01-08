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
} from 'lucide-react';
import toast from 'react-hot-toast';

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
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
}

const VendorVerification: React.FC = () => {
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Mock data
    const [vendors, setVendors] = useState<Vendor[]>([
        {
            id: '1',
            name: 'Pizza Palace',
            ownerName: 'John Doe',
            phone: '+919876543210',
            email: 'john@pizzapalace.com',
            address: '123 Main Street, Mumbai, Maharashtra 400001',
            category: 'Food - Italian',
            gstin: '27AABCU9603R1ZM',
            fssaiNumber: '12345678901234',
            documents: [
                { type: 'GST Certificate', url: '#', status: 'pending' },
                { type: 'FSSAI License', url: '#', status: 'pending' },
                { type: 'Shop License', url: '#', status: 'pending' },
                { type: 'ID Proof', url: '#', status: 'pending' },
            ],
            status: 'pending',
            submittedAt: '2024-12-20T10:30:00Z',
        },
        {
            id: '2',
            name: 'Fresh Mart Grocery',
            ownerName: 'Jane Smith',
            phone: '+919876543211',
            email: 'jane@freshmart.com',
            address: '456 Park Avenue, Delhi, Delhi 110001',
            category: 'Grocery',
            gstin: '07AABCU9603R1ZN',
            documents: [
                { type: 'GST Certificate', url: '#', status: 'pending' },
                { type: 'Shop License', url: '#', status: 'pending' },
                { type: 'ID Proof', url: '#', status: 'pending' },
            ],
            status: 'pending',
            submittedAt: '2024-12-21T14:15:00Z',
        },
    ]);

    const handleApprove = (vendorId: string) => {
        setVendors(vendors.map(v =>
            v.id === vendorId ? { ...v, status: 'approved' as const } : v
        ));
        toast.success('Vendor approved successfully!');
        setShowModal(false);
    };

    const handleReject = (vendorId: string) => {
        setVendors(vendors.map(v =>
            v.id === vendorId ? { ...v, status: 'rejected' as const } : v
        ));
        toast.error('Vendor rejected');
        setShowModal(false);
    };

    const openVendorModal = (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setShowModal(true);
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { class: string; text: string }> = {
            pending: { class: 'badge-warning', text: 'Pending' },
            approved: { class: 'badge-success', text: 'Approved' },
            rejected: { class: 'badge-danger', text: 'Rejected' },
        };
        const badge = badges[status] || badges.pending;
        return <span className={`badge ${badge.class}`}>{badge.text}</span>;
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
                    <select className="input">
                        <option>All Status</option>
                        <option>Pending</option>
                        <option>Approved</option>
                        <option>Rejected</option>
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
                            {vendors.map((vendor) => (
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
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
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
                                                <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            {selectedVendor.status === 'pending' && (
                                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => handleReject(selectedVendor.id)}
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorVerification;
