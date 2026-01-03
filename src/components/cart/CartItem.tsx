'use client';

import React from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, Package } from 'lucide-react';
import { useCartStore, type CartItem as CartItemType } from '@/store';

interface CartItemProps {
    item: CartItemType;
    compact?: boolean;
}

export function CartItem({ item, compact = false }: CartItemProps) {
    const { updateQuantity, removeItem } = useCartStore();

    const handleDecrease = () => {
        if (item.quantity > 1) {
            updateQuantity(item._id, item.quantity - 1);
        } else {
            removeItem(item._id);
        }
    };

    const handleIncrease = () => {
        if (item.quantity < item.stock) {
            updateQuantity(item._id, item.quantity + 1);
        }
    };

    if (compact) {
        return (
            <div className="flex items-center gap-3 py-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">
                        ${item.price.toFixed(2)} × {item.quantity}
                    </p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                </p>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-4 py-6 border-b border-gray-100">
            {/* Image */}
            <Link href={`/shop/${item.slug}`}>
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                        </div>
                    )}
                </div>
            </Link>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <Link href={`/shop/${item.slug}`}>
                    <h3 className="text-base font-medium text-gray-900 hover:text-primary-600 transition-colors">
                        {item.name}
                    </h3>
                </Link>
                <p className="text-sm text-gray-500 mt-1">{item.manufacturer}</p>
                <p className="text-sm text-gray-500">{item.category}</p>

                {/* Price */}
                <div className="mt-2">
                    <span className="text-lg font-semibold text-gray-900">
                        ${item.price.toFixed(2)}
                    </span>
                    {item.compareAtPrice && item.compareAtPrice > item.price && (
                        <span className="ml-2 text-sm text-gray-400 line-through">
                            ${item.compareAtPrice.toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Stock warning */}
                {item.quantity >= item.stock && (
                    <p className="text-xs text-yellow-600 mt-1">
                        Only {item.stock} available
                    </p>
                )}
            </div>

            {/* Quantity & Actions */}
            <div className="flex flex-col items-end gap-4">
                {/* Quantity Controls */}
                <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                        onClick={handleDecrease}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-medium text-gray-900">
                        {item.quantity}
                    </span>
                    <button
                        onClick={handleIncrease}
                        disabled={item.quantity >= item.stock}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Subtotal */}
                <p className="text-lg font-semibold text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                </p>

                {/* Remove Button */}
                <button
                    onClick={() => removeItem(item._id)}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Remove
                </button>
            </div>
        </div>
    );
}
