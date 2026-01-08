import toast, { type ToastOptions } from 'react-hot-toast';

const defaultOptions: ToastOptions = {
    duration: 4000,
    position: 'top-right',
    style: {
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
    },
};

// Success Toast
export const showSuccess = (message: string, options?: ToastOptions) => {
    return toast.success(message, {
        ...defaultOptions,
        ...options,
        icon: '✅',
        style: {
            ...defaultOptions.style,
            background: '#10B981',
            color: '#fff',
            ...options?.style,
        },
    });
};

// Error Toast
export const showError = (message: string, options?: ToastOptions) => {
    return toast.error(message, {
        ...defaultOptions,
        ...options,
        icon: '❌',
        duration: 5000,
        style: {
            ...defaultOptions.style,
            background: '#EF4444',
            color: '#fff',
            ...options?.style,
        },
    });
};

// Warning Toast
export const showWarning = (message: string, options?: ToastOptions) => {
    return toast(message, {
        ...defaultOptions,
        ...options,
        icon: '⚠️',
        style: {
            ...defaultOptions.style,
            background: '#F59E0B',
            color: '#fff',
            ...options?.style,
        },
    });
};

// Info Toast
export const showInfo = (message: string, options?: ToastOptions) => {
    return toast(message, {
        ...defaultOptions,
        ...options,
        icon: 'ℹ️',
        style: {
            ...defaultOptions.style,
            background: '#3B82F6',
            color: '#fff',
            ...options?.style,
        },
    });
};

// Loading Toast
export const showLoading = (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
        ...defaultOptions,
        ...options,
        duration: Infinity,
        style: {
            ...defaultOptions.style,
            background: '#6366F1',
            color: '#fff',
            ...options?.style,
        },
    });
};

// Promise Toast
export const showPromise = <T,>(
    promise: Promise<T>,
    messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
    },
    options?: ToastOptions
) => {
    return toast.promise(
        promise,
        {
            loading: messages.loading,
            success: messages.success,
            error: messages.error,
        },
        {
            ...defaultOptions,
            ...options,
            success: {
                icon: '✅',
                style: {
                    background: '#10B981',
                    color: '#fff',
                },
            },
            error: {
                icon: '❌',
                style: {
                    background: '#EF4444',
                    color: '#fff',
                },
            },
            loading: {
                icon: '⏳',
                style: {
                    background: '#6366F1',
                    color: '#fff',
                },
            },
        }
    );
};

// Admin-specific notifications
export const adminNotifications = {
    vendorApproved: (vendorName: string) =>
        showSuccess(`${vendorName} approved successfully!`),

    vendorRejected: (vendorName: string) =>
        showWarning(`${vendorName} rejected`),

    deliveryPartnerApproved: (partnerName: string) =>
        showSuccess(`${partnerName} approved successfully!`),

    settingsUpdated: () =>
        showSuccess('Settings updated successfully!'),

    dataExported: (type: string) =>
        showSuccess(`${type} data exported successfully!`),
};

// Order notifications
export const orderNotifications = {
    statusUpdated: (orderId: string, status: string) =>
        showSuccess(`Order #${orderId} status updated to ${status}`),

    orderCancelled: (orderId: string) =>
        showWarning(`Order #${orderId} cancelled`),
};

// Auth notifications
export const authNotifications = {
    loginSuccess: (name: string) =>
        showSuccess(`Welcome back, ${name}! 👋`),

    logoutSuccess: () =>
        showInfo('Logged out successfully'),

    sessionExpired: () =>
        showWarning('Your session has expired. Please login again.'),

    unauthorized: () =>
        showError('You are not authorized to perform this action'),
};

export default {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    loading: showLoading,
    promise: showPromise,
    admin: adminNotifications,
    order: orderNotifications,
    auth: authNotifications,
};
