'use client';

import React, { useState } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui';
import { Lock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface CheckoutFormProps {
    amount: number;
    orderId: string;
}

export function CheckoutForm({ amount, orderId }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);

        // Confirm payment
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL where Stripe redirects after payment
                return_url: `${window.location.origin}/checkout/success?orderId=${orderId}`,
            },
        });

        if (error) {
            // This point will only be reached if there is an immediate error during confirmation.
            // Otherwise, the customer will be redirected to the return_url.
            setErrorMessage(error.message || 'An unexpected error occurred.');
            toast.error(error.message || 'Payment failed');
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4">
                <div className="flex items-center gap-2 text-primary-700 font-bold text-sm mb-4">
                    <ShieldCheck className="w-4 h-4" />
                    SECURE CREDIT CARD PAYMENT
                </div>
                <PaymentElement id="payment-element" options={{ layout: 'accordion' }} />
            </div>

            {errorMessage && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 animate-shake">
                    {errorMessage}
                </div>
            )}

            <Button
                type="submit"
                disabled={isLoading || !stripe || !elements}
                isLoading={isLoading}
                className="w-full py-6 text-lg shadow-xl shadow-primary-100"
                size="lg"
                leftIcon={<Lock className="w-4 h-4" />}
            >
                Pay ${amount.toFixed(2)} & Complete Order
            </Button>

            <div className="flex items-center justify-center gap-2 text-gray-400">
                <Lock className="w-3 h-3" />
                <p className="text-[10px] font-bold uppercase tracking-widest">
                    Encrypted by Stripe
                </p>
            </div>
        </form>
    );
}
