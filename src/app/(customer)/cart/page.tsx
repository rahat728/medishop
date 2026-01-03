'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store';
import { CartItem, CartSummary } from '@/components/cart';
import { Button } from '@/components/ui';

export default function CartPage() {
  const { items, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-gray-400" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Your cart is empty
          </h1>

          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Looks like you haven't added anything to your cart yet.
            Start shopping to find great products!
          </p>

          <Link href="/shop">
            <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Start Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-500 mt-1">
            {items.length} item{items.length !== 1 ? 's' : ''} in your cart
          </p>
        </div>

        <button
          onClick={clearCart}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors font-medium"
        >
          <Trash2 className="w-4 h-4" />
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100 px-6">
              {items.map((item) => (
                <CartItem key={item._id} item={item} />
              ))}
            </div>
          </div>

          {/* Continue Shopping */}
          <div className="mt-6">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <CartSummary />
          </div>
        </div>
      </div>
    </div>
  );
}
