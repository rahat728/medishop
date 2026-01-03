'use client';

import React from 'react';
import Link from 'next/link';
import { Package, Star } from 'lucide-react';
import { Badge } from '@/components/ui';
import { AddToCartButton } from '@/components/cart';

interface ProductCardProps {
    product: {
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
        stock?: number;
        isFeatured?: boolean;
        discountPercentage?: number;
    };
}

export function ProductCard({ product }: ProductCardProps) {
    const cartProduct = {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        image: product.image,
        manufacturer: product.manufacturer,
        category: product.category,
        stock: product.stock || 0,
    };

    return (
        <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
            {/* Image */}
            <Link href={`/shop/${product.slug}`}>
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-gray-300" />
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.discountPercentage && product.discountPercentage > 0 && (
                            <Badge variant="error" size="sm">
                                -{product.discountPercentage}%
                            </Badge>
                        )}
                        {product.isFeatured && (
                            <Badge variant="warning" size="sm">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Featured
                            </Badge>
                        )}
                    </div>

                    {/* Out of Stock Overlay */}
                    {!product.inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge variant="default" size="lg">Out of Stock</Badge>
                        </div>
                    )}
                </div>
            </Link>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                {/* Category */}
                <p className="text-xs text-primary-600 font-medium mb-1">
                    {product.category}
                </p>

                {/* Name */}
                <Link href={`/shop/${product.slug}`}>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-1">
                        {product.name}
                    </h3>
                </Link>

                {/* Manufacturer */}
                <p className="text-sm text-gray-500 mb-2">
                    {product.manufacturer}
                </p>

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                    {product.description}
                </p>

                {/* Price & Action */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                    <div>
                        <span className="text-lg font-bold text-gray-900">
                            ${product.price.toFixed(2)}
                        </span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <span className="ml-2 text-sm text-gray-400 line-through">
                                ${product.compareAtPrice.toFixed(2)}
                            </span>
                        )}
                    </div>

                    <AddToCartButton product={cartProduct} size="sm" />
                </div>
            </div>
        </div>
    );
}
