'use client';

import React from 'react';
import { Package, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { StatsCard, StatsGrid } from '@/components/admin';

interface StockSummary {
    totalProducts: number;
    totalStock: number;
    outOfStock: number;
    lowStock: number;
    healthyStock: number;
}

interface StockOverviewProps {
    summary: StockSummary;
    loading?: boolean;
}

export function StockOverview({ summary, loading }: StockOverviewProps) {
    if (loading) {
        return (
            <StatsGrid columns={4}>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                        <div className="h-8 bg-gray-200 rounded w-16" />
                    </div>
                ))}
            </StatsGrid>
        );
    }

    return (
        <StatsGrid columns={4}>
            <StatsCard
                title="Total Products"
                value={summary.totalProducts}
                icon={<Package className="w-6 h-6 text-blue-600" />}
                iconBgColor="bg-blue-100"
            />
            <StatsCard
                title="In Stock"
                value={summary.healthyStock}
                icon={<CheckCircle className="w-6 h-6 text-green-600" />}
                iconBgColor="bg-green-100"
            />
            <StatsCard
                title="Low Stock"
                value={summary.lowStock}
                icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />}
                iconBgColor="bg-yellow-100"
            />
            <StatsCard
                title="Out of Stock"
                value={summary.outOfStock}
                icon={<XCircle className="w-6 h-6 text-red-600" />}
                iconBgColor="bg-red-100"
            />
        </StatsGrid>
    );
}
