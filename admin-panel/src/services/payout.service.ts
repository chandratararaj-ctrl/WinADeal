import api from './api';

export interface Payout {
    id: string;
    shopId?: string;
    deliveryPartnerId?: string;
    shop?: {
        id: string;
        name: string;
        user?: { name: string; phone: string };
    };
    deliveryPartner?: {
        id: string;
        user?: { name: string; phone: string };
    };
    amount: number;
    currency: string;
    status: 'PENDING' | 'PROCESSED' | 'FAILED' | 'REJECTED';
    method: 'BANK_TRANSFER' | 'UPI' | 'CASH';
    transactionRef?: string;
    notes?: string;
    createdAt: string;
    processedAt?: string;
}

export interface PayoutStats {
    pending: { count: number; amount: number };
    processed: { count: number; amount: number };
    commission?: { amount: number };
}

export interface VendorBalance {
    shopId: string;
    shopName: string;
    ownerName: string;
    phone: string;
    bankDetails: {
        account: string | null;
        ifsc: string | null;
    };
    totalEarnings: number;
    totalPaid: number;
    pendingBalance: number;
}

export interface DeliveryPartnerBalance {
    partnerId: string;
    name: string;
    phone: string;
    bankDetails: {
        account: string | null;
        ifsc: string | null;
    };
    totalEarnings: number;
    totalPaid: number;
    pendingBalance: number;
}

export const payoutService = {
    getPayouts: async (params?: any) => {
        const response = await api.get('/payouts', { params });
        return response.data.data;
    },

    updatePayoutStatus: async (id: string, data: { status: string; transactionRef?: string; notes?: string }) => {
        const response = await api.patch(`/payouts/${id}/status`, data);
        return response.data.data;
    },

    getStats: async () => {
        const response = await api.get('/payouts/stats');
        return response.data.data;
    },

    getVendorBalances: async () => {
        const response = await api.get('/payouts/vendor-balances');
        return response.data.data as VendorBalance[];
    },

    getDeliveryPartnerBalances: async () => {
        const response = await api.get('/payouts/delivery-partner-balances');
        return response.data.data as DeliveryPartnerBalance[];
    },

    createPayout: async (data: any) => {
        const response = await api.post('/payouts', data);
        return response.data.data;
    }
};
