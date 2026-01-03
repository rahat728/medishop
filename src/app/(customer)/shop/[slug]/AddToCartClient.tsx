'use client';

import React from 'react';
import { AddToCartButton } from '@/components/cart';

interface AddToCartClientProps {
    product: {
        _id: string;
        name: string;
        slug: string;
        price: number;
        compareAtPrice?: number;
        image?: string;
        manufacturer: string;
        category: string;
        stock: number;
    };
}

export function AddToCartClient({ product }: AddToCartClientProps) {
    return (
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <AddToCartButton
                product={product}
                showQuantity
                size="lg"
                fullWidth
            />

            <p className="text-xs text-gray-500 mt-4 text-center">
                Secure transaction • Free delivery on orders over $50
            </p>
        </div>
    );
}
