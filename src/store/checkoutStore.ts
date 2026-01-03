import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ShippingAddress {
    firstName: string;
    lastName: string;
    address: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
}

interface CheckoutState {
    step: number;
    shippingAddress: ShippingAddress | null;
    paymentMethod: 'card' | 'cod';

    // Actions
    setStep: (step: number) => void;
    setShippingAddress: (address: ShippingAddress) => void;
    setPaymentMethod: (method: 'card' | 'cod') => void;
    resetCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
    persist(
        (set) => ({
            step: 1,
            shippingAddress: null,
            paymentMethod: 'card',

            setStep: (step) => set({ step }),

            setShippingAddress: (address) => set({ shippingAddress: address }),

            setPaymentMethod: (method) => set({ paymentMethod: method }),

            resetCheckout: () => set({
                step: 1,
                shippingAddress: null,
                paymentMethod: 'card',
            }),
        }),
        {
            name: 'meddelivery-checkout',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
