import { useState, useEffect } from 'react';
import { Search, Eye, Ban, CheckCircle, ShoppingBag, MapPin, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    isVerified: boolean;
    isActive: boolean;
    totalOrders: number;
    totalSpent: number;
    joinedDate: string;
    lastOrderDate: string;
    addresses: {
        id: string;
        label: string;
        address: string;
    }[];
}

export default function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'verified'>('all');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Mock data - Replace with API call
    useEffect(() => {
        const mockCustomers: Customer[] = [
            {
                id: '1',
                name: 'Priya Sharma',
                phone: '+919876543210',
                email: 'priya@example.com',
                isVerified: true,
                isActive: true,
                totalOrders: 45,
                totalSpent: 12500,
                joinedDate: '2024-10-15',
                lastOrderDate: '2024-12-20',
                addresses: [
                    {
                        id: '1',
                        label: 'Home',
                        address: '123, MG Road, Delhi - 110001',
                    },
                    {
                        id: '2',
                        label: 'Office',
                        address: '456, Connaught Place, Delhi - 110002',
                    },
                ],
            },
            {
                id: '2',
                name: 'Rahul Verma',
                phone: '+919876543211',
                email: 'rahul@example.com',
                isVerified: true,
                isActive: true,
                totalOrders: 23,
                totalSpent: 8900,
                joinedDate: '2024-11-01',
                lastOrderDate: '2024-12-18',
                addresses: [
                    {
                        id: '3',
                        label: 'Home',
                        address: '789, Sector 15, Noida - 201301',
                    },
                ],
            },
            {
                id: '3',
                name: 'Sneha Patel',
                phone: '+919876543212',
                email: 'sneha@example.com',
                isVerified: false,
                isActive: true,
                totalOrders: 2,
                totalSpent: 450,
                joinedDate: '2024-12-15',
                lastOrderDate: '2024-12-16',
                addresses: [],
            },
        ];
        setCustomers(mockCustomers);
        setFilteredCustomers(mockCustomers);
    }, []);

    // Filter customers
    useEffect(() => {
        let filtered = customers;

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(
                (customer) =>
                    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    customer.phone.includes(searchQuery) ||
                    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter((customer) => {
                if (statusFilter === 'active') return customer.isActive;
                if (statusFilter === 'inactive') return !customer.isActive;
                if (statusFilter === 'verified') return customer.isVerified;
                return true;
            });
        }

        setFilteredCustomers(filtered);
    }, [searchQuery, statusFilter, customers]);

    const handleToggleActive = (customerId: string) => {
        const customer = customers.find((c) => c.id === customerId);
        setCustomers(
            customers.map((c) =>
                c.id === customerId ? { ...c, isActive: !c.isActive } : c
            )
        );
        toast.success(`Customer ${customer?.isActive ? 'deactivated' : 'activated'} successfully`);
    };

    const stats = {
        total: customers.length,
        active: customers.filter((c) => c.isActive).length,
        verified: customers.filter((c) => c.isVerified).length,
        totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                <p className="text-gray-600 mt-1">Manage customer accounts and view their activity</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Customers</p>
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
                            <p className="text-sm text-gray-600">Active Customers</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Verified</p>
                            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.verified}</p>
                        </div>
                        <div className="bg-indigo-100 p-3 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-indigo-600" />
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
                            <ShoppingBag className="w-6 h-6 text-purple-600" />
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
                        {['all', 'active', 'inactive', 'verified'].map((status) => (
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

            {/* Customers Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Orders
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Spent
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined
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
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                            <div className="text-sm text-gray-500">ID: {customer.id}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{customer.phone}</div>
                                        <div className="text-sm text-gray-500">{customer.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-medium">{customer.totalOrders}</div>
                                        <div className="text-sm text-gray-500">Last: {customer.lastOrderDate}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">₹{customer.totalSpent.toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{customer.joinedDate}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${customer.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {customer.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            {customer.isVerified && (
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedCustomer(customer);
                                                    setShowModal(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="View Details"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(customer.id)}
                                                className={`${customer.isActive
                                                    ? 'text-red-600 hover:text-red-900'
                                                    : 'text-green-600 hover:text-green-900'
                                                    }`}
                                                title={customer.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {customer.isActive ? <Ban className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Customer Detail Modal */}
            {showModal && selectedCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Personal Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Name</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedCustomer.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Phone</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedCustomer.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedCustomer.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Joined Date</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedCustomer.joinedDate}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Stats */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Statistics</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Total Orders</p>
                                        <p className="text-2xl font-bold text-blue-600">{selectedCustomer.totalOrders}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Total Spent</p>
                                        <p className="text-2xl font-bold text-green-600">₹{selectedCustomer.totalSpent.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Avg Order Value</p>
                                        <p className="text-2xl font-bold text-purple-600">
                                            ₹{selectedCustomer.totalOrders > 0 ? Math.round(selectedCustomer.totalSpent / selectedCustomer.totalOrders) : 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Addresses */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Saved Addresses</h3>
                                {selectedCustomer.addresses.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedCustomer.addresses.map((address) => (
                                            <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-start gap-3">
                                                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{address.label}</p>
                                                        <p className="text-sm text-gray-600 mt-1">{address.address}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No saved addresses</p>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
