'use client';

import React from 'react';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-gray-200 rounded-md ${className}`}
        />
    );
}

export function ProductSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <Skeleton className="aspect-square w-full" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-10 w-24 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
