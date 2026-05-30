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
    wardNo?: string;
    phone: string;
}

interface CheckoutState {
    step: number;
    shippingAddress: ShippingAddress | null;
    paymentMethod: 'card' | 'cod';
    isEmergency: boolean;

    // Actions
    setStep: (step: number) => void;
    setShippingAddress: (address: ShippingAddress) => void;
    setIsEmergency: (value: boolean) => void;
    setPaymentMethod: (method: 'card' | 'cod') => void;
    resetCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
    persist(
        (set) => ({
            step: 1,
            shippingAddress: null,
            paymentMethod: 'card',
            isEmergency: false,

            setStep: (step) => set({ step }),

            setShippingAddress: (address) => set({ shippingAddress: address }),

            setIsEmergency: (value) => set({ isEmergency: value }),

            setPaymentMethod: (method) => set({ paymentMethod: method }),

            resetCheckout: () => set({
                step: 1,
                shippingAddress: {
                    firstName: '',
                    lastName: '',
                    address: '',
                    apartment: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    wardNo: '',
                    phone: '',
                },
                paymentMethod: 'card',
                isEmergency: false,
            }),
        }),
        {
            name: 'medishop-checkout',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
