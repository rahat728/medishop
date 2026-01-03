'use client';

import React from 'react';
import { CreditCard, Banknote, ArrowLeft, ArrowRight, Wallet } from 'lucide-react';
import { useCheckoutStore } from '@/store';
import { Button } from '@/components/ui';

export function PaymentMethod() {
    const { paymentMethod, setPaymentMethod, setStep } = useCheckoutStore();

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                    <p className="text-sm text-gray-500">Choose how you'd like to pay</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Credit Card Option */}
                <button
                    onClick={() => setPaymentMethod('card')}
                    className={`
            group relative flex flex-col items-center justify-center p-8 border-2 rounded-2xl transition-all duration-300
            ${paymentMethod === 'card'
                            ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-50'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }
          `}
                >
                    <div className={`
             w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors
             ${paymentMethod === 'card' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}
          `}>
                        <CreditCard className="w-7 h-7" />
                    </div>
                    <span className={`font-bold text-lg ${paymentMethod === 'card' ? 'text-primary-700' : 'text-gray-900'}`}>
                        Credit / Debit Card
                    </span>
                    <span className="text-xs mt-2 text-gray-500 font-medium opacity-75">Secure Stripe Checkout</span>

                    {paymentMethod === 'card' && (
                        <div className="absolute top-4 right-4 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                    )}
                </button>

                {/* COD Option */}
                <button
                    onClick={() => setPaymentMethod('cod')}
                    className={`
            group relative flex flex-col items-center justify-center p-8 border-2 rounded-2xl transition-all duration-300
            ${paymentMethod === 'cod'
                            ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-50'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }
          `}
                >
                    <div className={`
             w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors
             ${paymentMethod === 'cod' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}
          `}>
                        <Banknote className="w-7 h-7" />
                    </div>
                    <span className={`font-bold text-lg ${paymentMethod === 'cod' ? 'text-primary-700' : 'text-gray-900'}`}>
                        Cash on Delivery
                    </span>
                    <span className="text-xs mt-2 text-gray-500 font-medium opacity-75">Pay when you receive items</span>

                    {paymentMethod === 'cod' && (
                        <div className="absolute top-4 right-4 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                    )}
                </button>
            </div>

            <div className="flex justify-between pt-8 border-t border-gray-100">
                <Button
                    variant="secondary"
                    className="px-8"
                    onClick={() => setStep(1)}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                    Back
                </Button>
                <Button
                    size="lg"
                    className="px-8 shadow-lg shadow-primary-100"
                    onClick={() => setStep(3)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                    Review Order
                </Button>
            </div>
        </div>
    );
}
