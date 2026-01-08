import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoriteShop {
    id: string;
    name: string;
    rating: number;
    category: string;
    addedAt: Date;
}

interface FavoriteProduct {
    id: string;
    name: string;
    price: number;
    shopId: string;
    shopName: string;
    addedAt: Date;
}

interface FavoritesState {
    favoriteShops: FavoriteShop[];
    favoriteProducts: FavoriteProduct[];

    // Shop favorites
    addShopToFavorites: (shop: Omit<FavoriteShop, 'addedAt'>) => void;
    removeShopFromFavorites: (shopId: string) => void;
    isShopFavorite: (shopId: string) => boolean;

    // Product favorites
    addProductToFavorites: (product: Omit<FavoriteProduct, 'addedAt'>) => void;
    removeProductFromFavorites: (productId: string) => void;
    isProductFavorite: (productId: string) => boolean;

    // Clear all
    clearAllFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
    persist(
        (set, get) => ({
            favoriteShops: [],
            favoriteProducts: [],

            addShopToFavorites: (shop) => {
                set((state) => ({
                    favoriteShops: [
                        ...state.favoriteShops.filter((s) => s.id !== shop.id),
                        { ...shop, addedAt: new Date() },
                    ],
                }));
            },

            removeShopFromFavorites: (shopId) => {
                set((state) => ({
                    favoriteShops: state.favoriteShops.filter((s) => s.id !== shopId),
                }));
            },

            isShopFavorite: (shopId) => {
                return get().favoriteShops.some((s) => s.id === shopId);
            },

            addProductToFavorites: (product) => {
                set((state) => ({
                    favoriteProducts: [
                        ...state.favoriteProducts.filter((p) => p.id !== product.id),
                        { ...product, addedAt: new Date() },
                    ],
                }));
            },

            removeProductFromFavorites: (productId) => {
                set((state) => ({
                    favoriteProducts: state.favoriteProducts.filter((p) => p.id !== productId),
                }));
            },

            isProductFavorite: (productId) => {
                return get().favoriteProducts.some((p) => p.id === productId);
            },

            clearAllFavorites: () => {
                set({ favoriteShops: [], favoriteProducts: [] });
            },
        }),
        {
            name: 'customer-favorites-storage',
        }
    )
);
