'use client';

import React, { useState } from 'react';
import { ShoppingCart, Check, Minus, Plus } from 'lucide-react';
import { useCartStore, type CartItem } from '@/store';
import { Button } from '@/components/ui';

interface AddToCartButtonProps {
    product: Omit<CartItem, 'quantity'>;
    showQuantity?: boolean;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export function AddToCartButton({
    product,
    showQuantity = false,
    size = 'md',
    fullWidth = false,
}: AddToCartButtonProps) {
    const [quantity, setQuantity] = useState(1);
    const [isAdded, setIsAdded] = useState(false);
    const { addItem, getItemById, openCart } = useCartStore();

    const cartItem = getItemById(product._id);
    const inStock = product.stock > 0;
    const availableStock = product.stock - (cartItem?.quantity || 0);

    const handleAddToCart = () => {
        if (!inStock || availableStock <= 0) return;

        addItem(product, quantity);
        setIsAdded(true);
        setQuantity(1);

        // Show added state briefly
        setTimeout(() => {
            setIsAdded(false);
        }, 2000);

        // Optionally open cart drawer
        // openCart();
    };

    if (!inStock) {
        return (
            <Button
                size={size}
                disabled
                className={fullWidth ? 'w-full' : ''}
            >
                Out of Stock
            </Button>
        );
    }

    return (
        <div className={`flex items-center gap-2 ${fullWidth ? 'w-full' : ''}`}>
            {showQuantity && (
                <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                    <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-2 text-gray-600 hover:text-gray-900 border-r border-gray-200"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{quantity}</span>
                    <button
                        onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                        disabled={quantity >= availableStock}
                        className="p-2 text-gray-600 hover:text-gray-900 border-l border-gray-200 disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            )}

            <Button
                size={size}
                onClick={handleAddToCart}
                disabled={availableStock <= 0}
                leftIcon={isAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                className={`${fullWidth ? 'flex-1' : ''} ${isAdded ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
                {isAdded ? 'Added!' : cartItem ? 'Add More' : 'Add to Cart'}
            </Button>
        </div>
    );
}
