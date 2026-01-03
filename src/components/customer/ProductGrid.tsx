'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { ProductCard } from './ProductCard';

interface Product {
    _id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number;
    category: string;
    image?: string;
    manufacturer: string;
    inStock: boolean;
    isFeatured?: boolean;
    discountPercentage?: number;
}

interface ProductGridProps {
    products: Product[];
    loading?: boolean;
    emptyMessage?: string;
    onAddToCart?: (productId: string) => void;
}

export function ProductGrid({
    products,
    loading = false,
    emptyMessage = 'No products found',
    onAddToCart,
}: ProductGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                        <div className="aspect-square bg-gray-200" />
                        <div className="p-4 space-y-3">
                            <div className="h-3 bg-gray-200 rounded w-16" />
                            <div className="h-5 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-24" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="flex justify-between items-center">
                                <div className="h-6 bg-gray-200 rounded w-16" />
                                <div className="h-8 bg-gray-200 rounded w-16" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyMessage}</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
                <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={onAddToCart}
                />
            ))}
        </div>
    );
}
