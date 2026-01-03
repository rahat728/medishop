'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Package } from 'lucide-react';

interface Medicine {
    _id: string;
    name: string;
    stock: number;
    lowStockThreshold: number;
    image?: string;
}

interface LowStockWidgetProps {
    medicines: Medicine[];
    loading?: boolean;
}

export function LowStockWidget({ medicines, loading }: LowStockWidgetProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 animate-pulse">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-32" />
                                <div className="h-2 bg-gray-200 rounded w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    Low Stock Alert
                </h3>
                <Link
                    href="/admin/medicines?filter=low-stock"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                    View all
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {medicines.length === 0 ? (
                <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">All items well stocked!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {medicines.map((medicine) => {
                        const stockPercentage = (medicine.stock / medicine.lowStockThreshold) * 100;
                        const isOutOfStock = medicine.stock === 0;

                        return (
                            <Link
                                key={medicine._id}
                                href={`/admin/medicines/${medicine._id}`}
                                className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                        {medicine.image ? (
                                            <img
                                                src={medicine.image}
                                                alt={medicine.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Package className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {medicine.name}
                                        </p>
                                        <div className="mt-1">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${isOutOfStock
                                                                ? 'bg-red-500'
                                                                : stockPercentage < 50
                                                                    ? 'bg-yellow-500'
                                                                    : 'bg-green-500'
                                                            }`}
                                                        style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-xs font-medium ${isOutOfStock ? 'text-red-600' : 'text-gray-600'
                                                    }`}>
                                                    {medicine.stock} left
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
