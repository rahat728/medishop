import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import toast from 'react-hot-toast';

// =============================================================================
// Types
// =============================================================================

export interface CartItem {
    _id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    image?: string;
    manufacturer: string;
    category: string;
    quantity: number;
    stock: number;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;

    // Actions
    addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    openCart: () => void;
    closeCart: () => void;

    // Computed
    getItemCount: () => number;
    getSubtotal: () => number;
    getItemById: (itemId: string) => CartItem | undefined;
}

// =============================================================================
// Store
// =============================================================================

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            addItem: (item, quantity = 1) => {
                const { items } = get();
                const existingItem = items.find((i) => i._id === item._id);

                if (existingItem) {
                    // Check stock limit
                    const newQuantity = existingItem.quantity + quantity;
                    if (newQuantity > item.stock) {
                        toast.error(`Only ${item.stock} items available`);
                        return;
                    }

                    set({
                        items: items.map((i) =>
                            i._id === item._id
                                ? { ...i, quantity: newQuantity }
                                : i
                        ),
                    });
                    toast.success(`Updated ${item.name} quantity`);
                } else {
                    // Check stock
                    if (quantity > item.stock) {
                        toast.error(`Only ${item.stock} items available`);
                        return;
                    }

                    set({
                        items: [...items, { ...item, quantity }],
                    });
                    toast.success(`${item.name} added to cart`);
                }
            },

            removeItem: (itemId) => {
                const { items } = get();
                const item = items.find((i) => i._id === itemId);

                set({
                    items: items.filter((i) => i._id !== itemId),
                });

                if (item) {
                    toast.success(`${item.name} removed from cart`);
                }
            },

            updateQuantity: (itemId, quantity) => {
                const { items } = get();
                const item = items.find((i) => i._id === itemId);

                if (!item) return;

                if (quantity <= 0) {
                    get().removeItem(itemId);
                    return;
                }

                if (quantity > item.stock) {
                    toast.error(`Only ${item.stock} items available`);
                    return;
                }

                set({
                    items: items.map((i) =>
                        i._id === itemId ? { ...i, quantity } : i
                    ),
                });
            },

            clearCart: () => {
                set({ items: [] });
                toast.success('Cart cleared');
            },

            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),

            getItemCount: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            },

            getSubtotal: () => {
                return get().items.reduce(
                    (total, item) => total + item.price * item.quantity,
                    0
                );
            },

            getItemById: (itemId) => {
                return get().items.find((i) => i._id === itemId);
            },
        }),
        {
            name: 'medishop-cart',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ items: state.items }),
        }
    )
);
