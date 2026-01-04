'use client';

import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe/client';
import { CheckoutForm } from './CheckoutForm';
import { Spinner } from '@/components/ui';
import { useCartStore } from '@/store';

interface PaymentWrapperProps {
    shippingAddress: any;
}

export function PaymentWrapper({ shippingAddress }: PaymentWrapperProps) {
    const { items } = useCartStore();
    const [clientSecret, setClientSecret] = useState('');
    const [amount, setAmount] = useState(0);
    const [orderId, setOrderId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (items.length === 0) {
            setError('Your cart is empty');
            setLoading(false);
            return;
        }

        // Create PaymentIntent as soon as the page loads
        fetch('/api/payment/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: items.map(item => ({
                    medicine: item._id,
                    quantity: item.quantity
                })),
                shippingAddress: shippingAddress
            })
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setClientSecret(data.data.clientSecret);
                    setAmount(data.data.amount);
                    setOrderId(data.data.orderId);
                } else {
                    setError(data.error || 'Failed to initialize payment');
                }
            })
            .catch((err) => {
                console.error('Error:', err);
                setError('Network error. Please try again.');
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Spinner size="lg" className="text-primary-500" />
                <p className="text-sm font-medium text-gray-400 animate-pulse">Initializing secure payment...</p>
            </div>
        );
    }

    if (error || !clientSecret) {
        return (
            <div className="text-center py-8">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 inline-block mb-4">
                    {error || 'Failed to initialize payment. Please refresh the page.'}
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="block mx-auto text-xs font-bold text-primary-600 hover:underline uppercase tracking-widest"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <Elements
            stripe={getStripe()}
            options={{
                clientSecret,
                appearance: {
                    theme: 'night', // or 'stripe', 'flat'
                    variables: {
                        colorPrimary: '#00afaf',
                        colorBackground: '#ffffff',
                        colorText: '#1f2937',
                        colorDanger: '#ef4444',
                        borderRadius: '16px',
                    },
                },
            }}
        >
            <CheckoutForm amount={amount} orderId={orderId} />
        </Elements>
    );
}
