'use client';

import React from 'react';
import { Shield } from 'lucide-react';
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
        <div className="space-y-4">
            <AddToCartButton
                product={product}
                showQuantity
                size="lg"
                fullWidth
            />

            <div className="flex items-center justify-center gap-2 py-2">
                <Shield className="w-4 h-4 text-green-500" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Safe payment • Free delivery over ৳500
                </p>
            </div>
        </div>
    );
}
