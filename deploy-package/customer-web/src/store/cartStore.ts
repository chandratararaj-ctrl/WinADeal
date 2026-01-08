import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    shopId: string;
    shopName: string;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
    getShopId: () => string | null;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (item) => {
                const currentItems = get().items;
                const shopId = get().getShopId();
                const quantityToAdd = (item as any).quantity || 1;

                // Check if adding from different shop
                if (shopId && shopId !== item.shopId) {
                    if (!confirm('Adding items from a different shop will clear your current cart. Continue?')) {
                        return;
                    }
                    set({ items: [{ ...item, quantity: quantityToAdd }] });
                    return;
                }

                const existingItem = currentItems.find((i) => i.productId === item.productId);

                if (existingItem) {
                    set({
                        items: currentItems.map((i) =>
                            i.productId === item.productId
                                ? { ...i, quantity: i.quantity + quantityToAdd }
                                : i
                        ),
                    });
                } else {
                    set({ items: [...currentItems, { ...item, quantity: quantityToAdd }] });
                }
            },

            removeItem: (productId) => {
                set((state) => ({
                    items: state.items.filter((item) => item.productId !== productId),
                }));
            },

            updateQuantity: (productId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }

                set((state) => ({
                    items: state.items.map((item) =>
                        item.productId === productId ? { ...item, quantity } : item
                    ),
                }));
            },

            clearCart: () => set({ items: [] }),

            getTotalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            },

            getTotalPrice: () => {
                return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
            },

            getShopId: () => {
                const items = get().items;
                return items.length > 0 ? items[0].shopId : null;
            },
        }),
        {
            name: 'customer-cart-storage',
        }
    )
);
