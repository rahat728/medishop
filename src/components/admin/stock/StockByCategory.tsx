'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';

interface CategoryStock {
    _id: string;
    count: number;
    totalStock: number;
    outOfStock: number;
    lowStock: number;
}

interface StockByCategoryProps {
    categories: CategoryStock[];
    loading?: boolean;
}

export function StockByCategory({ categories, loading }: StockByCategoryProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                        Stock by Category
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="flex justify-between mb-2">
                                    <div className="h-4 bg-gray-200 rounded w-24" />
                                    <div className="h-4 bg-gray-200 rounded w-16" />
                                </div>
                                <div className="h-2 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const maxStock = Math.max(...categories.map((c) => c.totalStock), 1);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                    Stock by Category
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {categories.map((category) => {
                        const healthyStock = category.count - category.outOfStock - category.lowStock;
                        const healthyPercent = (healthyStock / category.count) * 100;
                        const lowPercent = (category.lowStock / category.count) * 100;
                        const outPercent = (category.outOfStock / category.count) * 100;

                        return (
                            <div key={category._id}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">{category._id}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">{category.totalStock} units</span>
                                        {category.outOfStock > 0 && (
                                            <Badge variant="error">{category.outOfStock}</Badge>
                                        )}
                                        {category.lowStock > 0 && (
                                            <Badge variant="warning">{category.lowStock}</Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Stacked progress bar */}
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                                    {healthyPercent > 0 && (
                                        <div
                                            className="bg-green-500 transition-all"
                                            style={{ width: `${healthyPercent}%` }}
                                        />
                                    )}
                                    {lowPercent > 0 && (
                                        <div
                                            className="bg-yellow-500 transition-all"
                                            style={{ width: `${lowPercent}%` }}
                                        />
                                    )}
                                    {outPercent > 0 && (
                                        <div
                                            className="bg-red-500 transition-all"
                                            style={{ width: `${outPercent}%` }}
                                        />
                                    )}
                                </div>

                                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                    <span>{category.count} products</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-xs text-gray-500">In Stock</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-xs text-gray-500">Low Stock</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-xs text-gray-500">Out of Stock</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
