'use client';

import React from 'react';
import Link from 'next/link';
import { Package, AlertTriangle, XCircle, ArrowRight, Edit } from 'lucide-react';
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface Medicine {
    _id: string;
    name: string;
    slug: string;
    stock: number;
    lowStockThreshold: number;
    category: string;
    image?: string;
    manufacturer: string;
}

interface StockAlertsListProps {
    medicines: Medicine[];
    loading?: boolean;
    onUpdateStock: (medicine: Medicine) => void;
}

export function StockAlertsList({ medicines, loading, onUpdateStock }: StockAlertsListProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        Stock Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 animate-pulse">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-32" />
                                    <div className="h-3 bg-gray-200 rounded w-24" />
                                </div>
                                <div className="h-8 bg-gray-200 rounded w-20" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const outOfStock = medicines.filter((m) => m.stock === 0);
    const lowStock = medicines.filter((m) => m.stock > 0 && m.stock <= m.lowStockThreshold);

    if (outOfStock.length === 0 && lowStock.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        Stock Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-gray-600 font-medium">All products are well stocked!</p>
                        <p className="text-sm text-gray-500 mt-1">No stock alerts at the moment.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const renderMedicineItem = (medicine: Medicine, isOutOfStock: boolean) => (
        <div
            key={medicine._id}
            className={`flex items-center gap-4 p-4 rounded-lg border ${isOutOfStock ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                }`}
        >
            <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                {medicine.image ? (
                    <img
                        src={medicine.image}
                        alt={medicine.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Package className="w-6 h-6 text-gray-400" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <Link
                        href={`/medicines/${medicine._id}`}
                        className="font-medium text-gray-900 hover:text-primary-600 truncate"
                    >
                        {medicine.name}
                    </Link>
                    {isOutOfStock ? (
                        <Badge variant="error">Out of Stock</Badge>
                    ) : (
                        <Badge variant="warning">Low Stock</Badge>
                    )}
                </div>
                <p className="text-sm text-gray-500 truncate">
                    {medicine.manufacturer} • {medicine.category}
                </p>
            </div>

            <div className="text-right">
                <div className={`text-lg font-bold ${isOutOfStock ? 'text-red-600' : 'text-yellow-600'}`}>
                    {medicine.stock}
                </div>
                <div className="text-xs text-gray-500">
                    of {medicine.lowStockThreshold} min
                </div>
            </div>

            <Button
                size="sm"
                variant="secondary"
                onClick={() => onUpdateStock(medicine)}
                leftIcon={<Edit className="w-3 h-3" />}
            >
                Update
            </Button>
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        Stock Alerts
                        <Badge variant="warning">{outOfStock.length + lowStock.length}</Badge>
                    </CardTitle>
                    <Link href="/medicines?filter=low-stock">
                        <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                            View all
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Out of Stock Section */}
                {outOfStock.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <h4 className="text-sm font-medium text-red-700">
                                Out of Stock ({outOfStock.length})
                            </h4>
                        </div>
                        <div className="space-y-3">
                            {outOfStock.slice(0, 3).map((m) => renderMedicineItem(m, true))}
                            {outOfStock.length > 3 && (
                                <p className="text-sm text-gray-500 text-center">
                                    +{outOfStock.length - 3} more out of stock items
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Low Stock Section */}
                {lowStock.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            <h4 className="text-sm font-medium text-yellow-700">
                                Low Stock ({lowStock.length})
                            </h4>
                        </div>
                        <div className="space-y-3">
                            {lowStock.slice(0, 3).map((m) => renderMedicineItem(m, false))}
                            {lowStock.length > 3 && (
                                <p className="text-sm text-gray-500 text-center">
                                    +{lowStock.length - 3} more low stock items
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
