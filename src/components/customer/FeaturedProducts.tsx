'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui';

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

interface FeaturedProductsProps {
    onAddToCart?: (productId: string) => void;
}

export function FeaturedProducts({ onAddToCart }: FeaturedProductsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const response = await fetch('/api/shop/featured?limit=4');
                const data = await response.json();
                if (data.success) {
                    setProducts(data.data.medicines);
                }
            } catch (error) {
                console.error('Error fetching featured products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeatured();
    }, []);

    if (loading) {
        return (
            <section className="py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
                    <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse" />
                    ))}
                </div>
            </section>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="py-12">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    Featured Products
                </h2>
                <Link href="/shop?featured=true">
                    <Button variant="ghost" rightIcon={<ArrowRight className="w-4 h-4" />}>
                        View All
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ProductCard
                        key={product._id}
                        product={product}
                        onAddToCart={onAddToCart}
                    />
                ))}
            </div>
        </section>
    );
}
