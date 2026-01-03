'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, ShoppingCart, ArrowRight, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store';
import { CartItem } from './CartItem';
import { Button } from '@/components/ui';

export function CartDrawer() {
    const { items, isOpen, closeCart, clearCart, getSubtotal } = useCartStore();
    const subtotal = getSubtotal();

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 transition-opacity"
                onClick={closeCart}
            />

            {/* Drawer */}
            <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        Shopping Cart
                        {items.length > 0 && (
                            <span className="bg-primary-100 text-primary-700 text-sm px-2 py-0.5 rounded-full">
                                {items.length}
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={closeCart}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <ShoppingCart className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Your cart is empty
                        </h3>
                        <p className="text-gray-500 text-center mb-6">
                            Add some products to get started!
                        </p>
                        <Link href="/shop" onClick={closeCart}>
                            <Button>Continue Shopping</Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Items */}
                        <div className="flex-1 overflow-y-auto px-6 divide-y divide-gray-100">
                            {items.map((item) => (
                                <CartItem key={item._id} item={item} compact />
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-100 p-6 space-y-4">
                            {/* Clear Cart */}
                            <div className="flex justify-end">
                                <button
                                    onClick={clearCart}
                                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear Cart
                                </button>
                            </div>

                            {/* Subtotal */}
                            <div className="flex justify-between text-lg font-semibold">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>

                            <p className="text-sm text-gray-500">
                                Shipping and taxes calculated at checkout
                            </p>

                            {/* Actions */}
                            <div className="space-y-3">
                                <Link href="/checkout" onClick={closeCart}>
                                    <Button className="w-full" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                                        Checkout
                                    </Button>
                                </Link>
                                <Link href="/cart" onClick={closeCart}>
                                    <Button variant="secondary" className="w-full">
                                        View Cart
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
