'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, useCheckoutStore } from '@/store';
import { CartSummary } from '@/components/cart';
import {
    CheckoutSteps,
    ShippingForm,
    PaymentMethod,
    OrderReview,
} from '@/components/checkout';
import { Lock, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks';

export default function CheckoutPage() {
    const router = useRouter();
    const { items } = useCartStore();
    const { step } = useCheckoutStore();
    const { isAuthenticated, isLoading } = useAuth();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Redirect if cart is empty or not authenticated
    useEffect(() => {
        if (isMounted) {
            if (items.length === 0) {
                router.push('/cart');
            } else if (!isLoading && !isAuthenticated) {
                router.push('/login?callbackUrl=/checkout');
            }
        }
    }, [items, isAuthenticated, isLoading, router, isMounted]);

    if (!isMounted || isLoading || items.length === 0 || !isAuthenticated) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Preparing secure checkout...</p>
            </div>
        );
    }

    const renderStep = () => {
        switch (step) {
            case 1:
                return <ShippingForm />;
            case 2:
                return <PaymentMethod />;
            case 3:
                return <OrderReview />;
            default:
                return <ShippingForm />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 font-medium transition-colors mb-4">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Cart
                        </Link>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Checkout</h1>
                    </div>

                    <div className="flex items-center gap-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                                <Lock className="w-4 h-4" />
                                SECURE CHECKOUT
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">256-bit SSL encryption</p>
                        </div>
                        <div className="h-10 w-px bg-gray-100" />
                        <ShieldCheck className="w-8 h-8 text-primary-500" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        <CheckoutSteps currentStep={step} />

                        <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-10 shadow-xl shadow-gray-200/50">
                            {renderStep()}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-28 space-y-6">
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                                <div className="bg-primary-500 px-6 py-4">
                                    <h3 className="font-bold text-white uppercase tracking-widest text-xs">Order Summary</h3>
                                </div>
                                <div className="p-6">
                                    <CartSummary showCheckoutButton={false} />
                                </div>
                            </div>

                            {/* Trust Badges */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col items-center text-center shadow-sm">
                                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mb-2">
                                        <ShieldCheck className="w-5 h-5 text-green-600" />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-900 uppercase">100% Secure</span>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col items-center text-center shadow-sm">
                                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                                        <Lock className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-900 uppercase">Privacy Policy</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
