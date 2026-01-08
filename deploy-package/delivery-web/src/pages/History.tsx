
import { useEffect, useState } from 'react';
import { deliveryService } from '../services/delivery.service';
import { Package, MapPin, Calendar, IndianRupee } from 'lucide-react';
import clsx from 'clsx';

interface Delivery {
    id: string;
    orderId: string;
    deliveryFee: number;
    createdAt: string;
    order: {
        orderNumber: string;
        status: string;
        shop: {
            name: string;
            address: string;
        };
        deliveryAddress: {
            addressLine1: string;
            city: string;
        };
        total: number;
    };
}

export default function History() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await deliveryService.getMyDeliveries('history');
                setDeliveries(data);
            } catch (error) {
                console.error('Failed to fetch history', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (deliveries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Package className="w-12 h-12 mb-2 opacity-50" />
                <p>No past deliveries found.</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 max-w-lg mx-auto pb-20">
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Delivery History
            </h1>

            <div className="space-y-3">
                {deliveries.map((delivery) => (
                    <div 
                        key={delivery.id} 
                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <span className="text-xs font-mono text-gray-500">#{delivery.order.orderNumber}</span>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {delivery.order.shop.name}
                                </h3>
                            </div>
                            <div className="text-right">
                                <span className={clsx(
                                    "px-2 py-1 rounded-full text-xs font-medium",
                                    delivery.order.status === 'DELIVERED' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                )}>
                                    {delivery.order.status}
                                </span>
                                <div className="flex items-center justify-end mt-1 text-emerald-600 font-bold">
                                    <IndianRupee className="w-3 h-3" />
                                    <span>{delivery.deliveryFee.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                                <span className="line-clamp-1">{delivery.order.deliveryAddress.addressLine1}, {delivery.order.deliveryAddress.city}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(delivery.createdAt).toLocaleDateString()} • {new Date(delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
