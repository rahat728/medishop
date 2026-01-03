'use client';

import React from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';

interface OrderItem {
    medicine: {
        _id: string;
        name: string;
        image?: string;
    };
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
}

interface OrderItemsListProps {
    items: OrderItem[];
    subtotal: number;
    deliveryFee: number;
    tax: number;
    discount: number;
    total: number;
}

export function OrderItemsList({
    items,
    subtotal,
    deliveryFee,
    tax,
    discount,
    total,
}: OrderItemsListProps) {
    return (
        <div className="space-y-4">
            {/* Items */}
            <div className="divide-y divide-gray-100">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 py-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.medicine?.image ? (
                                <img
                                    src={item.medicine.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-6 h-6 text-gray-400" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <Link
                                href={`/medicines/${item.medicine?._id}`}
                                className="font-medium text-gray-900 hover:text-primary-600 block truncate"
                            >
                                {item.name}
                            </Link>
                            <p className="text-sm text-gray-500">
                                ${item.price.toFixed(2)} × {item.quantity}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-medium text-gray-900">
                                ${item.subtotal.toFixed(2)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="text-gray-900">${deliveryFee.toFixed(2)}</span>
                </div>
                {tax > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tax</span>
                        <span className="text-gray-900">${tax.toFixed(2)}</span>
                    </div>
                )}
                {discount > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Discount</span>
                        <span className="text-green-600">-${discount.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">${total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}
