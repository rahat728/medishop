'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, CreditCard, ShoppingBag, Banknote, ShieldCheck } from 'lucide-react';
import { useCartStore, useCheckoutStore } from '@/store';
import { Button } from '@/components/ui';
import { CartItem } from '@/components/cart';
import { PaymentWrapper } from './stripe';
import toast from 'react-hot-toast';

export function OrderReview() {
    const router = useRouter();
    const { items, getSubtotal, clearCart } = useCartStore();
    const { shippingAddress, paymentMethod, setStep, resetCheckout } = useCheckoutStore();
    const [isProcessing, setIsProcessing] = useState(false);

    const subtotal = getSubtotal();
    const deliveryFee = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08;
    const total = subtotal + deliveryFee + tax;

    const handlePlaceOrderCOD = async () => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: items.map(item => ({
                        medicine: item._id,
                        quantity: item.quantity,
                    })),
                    shippingAddress: {
                        street: shippingAddress?.address,
                        city: shippingAddress?.city,
                        state: shippingAddress?.state,
                        zipCode: shippingAddress?.zipCode,
                        wardNo: shippingAddress?.wardNo,
                    },
                    paymentMethod: 'cod',
                    totalAmount: total,
                    // Extra info for notification/display
                    customerInfo: {
                        firstName: shippingAddress?.firstName,
                        lastName: shippingAddress?.lastName,
                        phone: shippingAddress?.phone,
                        apartment: shippingAddress?.apartment,
                    }
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to place order');
            }

            toast.success('Order placed successfully!');

            // Store order ID for success page
            const orderId = result.data._id;

            clearCart();
            resetCheckout();

            router.push(`/checkout/success?orderId=${orderId}`);
        } catch (error: any) {
            toast.error(error.message || 'Something went wrong');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!shippingAddress) {
        setStep(1);
        return null;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Review Your Order</h2>
                    <p className="text-sm text-gray-500">Last step before confirmation</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping Summary */}
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <MapPin className="w-4 h-4 text-primary-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Shipping To</h3>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-bold text-gray-900 text-base mb-1">
                            {shippingAddress.firstName} {shippingAddress.lastName}
                        </p>
                        <p>{shippingAddress.address}</p>
                        {shippingAddress.apartment && <p>{shippingAddress.apartment}</p>}
                        <p>
                            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                        </p>
                        {shippingAddress.wardNo && <p className="text-primary-600 font-medium">Ward No: {shippingAddress.wardNo}</p>}
                        <p className="mt-2 font-medium text-gray-500">{shippingAddress.phone}</p>
                    </div>
                    <button
                        onClick={() => setStep(1)}
                        className="absolute top-6 right-6 text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        Edit
                    </button>
                </div>

                {/* Payment Summary */}
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            {paymentMethod === 'card' ? <CreditCard className="w-4 h-4 text-primary-500" /> : <Banknote className="w-4 h-4 text-primary-500" />}
                        </div>
                        <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Payment Method</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-bold text-gray-900 text-base">
                            {paymentMethod === 'card' ? 'Credit / Debit Card' : 'Cash on Delivery'}
                        </div>
                        <div className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-md">
                            Secure
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        {paymentMethod === 'card' ? 'Transaction processed via Stripe' : 'Pay in cash upon delivery'}
                    </p>
                    <button
                        onClick={() => setStep(2)}
                        className="absolute top-6 right-6 text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        Edit
                    </button>
                </div>
            </div>

            {/* Items Review */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-primary-600" />
                    </div>
                    <h3 className="font-bold text-gray-900">Items ({items.length})</h3>
                </div>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    {items.map((item) => (
                        <div key={item._id} className="p-4 bg-white hover:bg-gray-50/50 transition-colors">
                            <CartItem item={item} compact />
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment Action Section */}
            <div className="pt-8 border-t border-gray-100">
                {paymentMethod === 'card' ? (
                    <div className="max-w-lg mx-auto">
                        <PaymentWrapper shippingAddress={{
                            street: shippingAddress.address,
                            city: shippingAddress.city,
                            state: shippingAddress.state,
                            zipCode: shippingAddress.zipCode,
                            apartment: shippingAddress.apartment,
                            firstName: shippingAddress.firstName,
                            lastName: shippingAddress.lastName,
                            phone: shippingAddress.phone,
                            wardNo: shippingAddress.wardNo
                        }} />
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto px-8"
                            onClick={() => setStep(2)}
                            leftIcon={<ArrowLeft className="w-4 h-4" />}
                            disabled={isProcessing}
                        >
                            Back to Payment
                        </Button>
                        <Button
                            size="lg"
                            className="w-full sm:w-auto px-12 shadow-xl shadow-primary-200 text-lg py-6"
                            onClick={handlePlaceOrderCOD}
                            isLoading={isProcessing}
                        >
                            Place Order & Pay ${total.toFixed(2)}
                        </Button>
                    </div>
                )}
            </div>

            {paymentMethod === 'card' && (
                <div className="flex justify-center">
                    <button
                        onClick={() => setStep(2)}
                        className="text-sm font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
                    >
                        Back to Payment Selection
                    </button>
                </div>
            )}
        </div>
    );
}
