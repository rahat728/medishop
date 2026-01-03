'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useCartStore } from '@/store';
import { Button } from '@/components/ui';

interface CartSummaryProps {
    showCheckoutButton?: boolean;
}

export function CartSummary({ showCheckoutButton = true }: CartSummaryProps) {
    const { items, getSubtotal } = useCartStore();

    const subtotal = getSubtotal();
    const deliveryFee = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + deliveryFee + tax;

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

            <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({items.length} items)</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    {deliveryFee === 0 ? (
                        <span className="text-green-600 font-medium">FREE</span>
                    ) : (
                        <span>${deliveryFee.toFixed(2)}</span>
                    )}
                </div>

                <div className="flex justify-between text-gray-600">
                    <span>Estimated Tax</span>
                    <span>${tax.toFixed(2)}</span>
                </div>

                {subtotal < 50 && (
                    <div className="bg-yellow-50 text-yellow-800 text-sm p-3 rounded-lg">
                        Add ${(50 - subtotal).toFixed(2)} more for free delivery!
                    </div>
                )}

                <div className="border-t border-gray-100 pt-3">
                    <div className="flex justify-between text-lg font-semibold text-gray-900">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {showCheckoutButton && (
                <>
                    <Link href="/checkout">
                        <Button className="w-full" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                            Proceed to Checkout
                        </Button>
                    </Link>

                    <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        <span>Secure checkout with SSL encryption</span>
                    </div>
                </>
            )}
        </div>
    );
}
