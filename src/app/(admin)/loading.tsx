'use client';

import React from 'react';
import { Skeleton } from '@/components/ui';

export default function AdminLoading() {
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="w-12 h-12 rounded-xl" />
                            <Skeleton className="w-16 h-4" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100">
                    <Skeleton className="h-6 w-32 mb-8" />
                    <Skeleton className="h-[200px] w-full" />
                </div>
                <div className="bg-white p-8 rounded-2xl border border-gray-100">
                    <Skeleton className="h-6 w-32 mb-8" />
                    <div className="flex justify-center">
                        <Skeleton className="w-40 h-40 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
