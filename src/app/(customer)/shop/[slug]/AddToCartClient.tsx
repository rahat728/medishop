'use client';

import React, { useState } from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui';

interface AddToCartButtonProps {
    productId: string;
    productName: string;
    inStock: boolean;
}

export function AddToCartButton({ productId, productName, inStock }: AddToCartButtonProps) {
    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const handleAddToCart = async () => {
        setIsLoading(true);
        try {
            // Will be implemented in Day 10
            await new Promise((resolve) => setTimeout(resolve, 500));
            toast.success(`${quantity} x ${productName} added to cart!`);
        } catch (error) {
            toast.error('Failed to add to cart');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={!inStock || quantity <= 1}
                    className="p-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium text-gray-900">{quantity}</span>
                <button
                    onClick={() => setQuantity((q) => q + 1)}
                    disabled={!inStock}
                    className="p-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Add to Cart Button */}
            <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={!inStock}
                isLoading={isLoading}
                leftIcon={<ShoppingCart className="w-5 h-5" />}
                className="flex-1"
            >
                {inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
        </div>
    );
}
