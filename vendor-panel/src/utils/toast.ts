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

// Promise Toast (auto-handles loading, success, error)
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

// Custom Toast with custom icon and styling
export const showCustom = (
    message: string,
    icon: string,
    backgroundColor: string,
    options?: ToastOptions
) => {
    return toast(message, {
        ...defaultOptions,
        ...options,
        icon,
        style: {
            ...defaultOptions.style,
            background: backgroundColor,
            color: '#fff',
            ...options?.style,
        },
    });
};

// Dismiss specific toast
export const dismissToast = (toastId: string) => {
    toast.dismiss(toastId);
};

// Dismiss all toasts
export const dismissAllToasts = () => {
    toast.dismiss();
};

// Order-specific notifications
export const orderNotifications = {
    newOrder: (orderId: string) =>
        showSuccess(`New order #${orderId} received!`, { duration: 6000 }),

    orderAccepted: (orderId: string) =>
        showSuccess(`Order #${orderId} accepted successfully!`),

    orderPreparing: (orderId: string) =>
        showInfo(`Order #${orderId} is being prepared...`),

    orderReady: (orderId: string) =>
        showSuccess(`Order #${orderId} is ready for pickup!`),

    orderDelivered: (orderId: string) =>
        showSuccess(`Order #${orderId} delivered successfully! 🎉`),

    orderCancelled: (orderId: string) =>
        showWarning(`Order #${orderId} has been cancelled`),

    orderFailed: (orderId: string, reason: string) =>
        showError(`Order #${orderId} failed: ${reason}`),
};

// Vendor-specific notifications
export const vendorNotifications = {
    shopOpened: () =>
        showSuccess('Your shop is now open for orders! 🏪'),

    shopClosed: () =>
        showInfo('Your shop is now closed'),

    productAdded: (productName: string) =>
        showSuccess(`${productName} added successfully!`),

    productUpdated: (productName: string) =>
        showSuccess(`${productName} updated successfully!`),

    productDeleted: (productName: string) =>
        showWarning(`${productName} deleted`),

    lowStock: (productName: string, quantity: number) =>
        showWarning(`Low stock alert: ${productName} (${quantity} left)`),
};

// Delivery-specific notifications
export const deliveryNotifications = {
    assignedDelivery: (orderId: string) =>
        showInfo(`New delivery assigned: Order #${orderId}`),

    deliveryStarted: (orderId: string) =>
        showSuccess(`Delivery started for Order #${orderId}`),

    deliveryCompleted: (orderId: string, earnings: number) =>
        showSuccess(`Delivery for Order #${orderId} completed! Earned ₹${earnings} 💰`),

    deliveryFailed: (orderId: string, reason: string) =>
        showError(`Delivery for Order #${orderId} failed: ${reason}`),
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
    custom: showCustom,
    dismiss: dismissToast,
    dismissAll: dismissAllToasts,
    order: orderNotifications,
    vendor: vendorNotifications,
    delivery: deliveryNotifications,
    auth: authNotifications,
};
