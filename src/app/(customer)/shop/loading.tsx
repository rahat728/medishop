'use client';

import React from 'react';
import { ProductSkeleton } from '@/components/ui';

export default function ShopLoading() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
            <div className="mb-8 space-y-2">
                <div className="h-10 bg-gray-200 rounded-md w-64 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded-md w-96 animate-pulse" />
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <aside className="hidden lg:block w-64 space-y-6">
                    <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
                    <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
                </aside>

                <main className="flex-1 space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                        <div className="h-10 bg-gray-200 rounded w-40 animate-pulse" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <ProductSkeleton key={i} />
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
