'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, ArrowRight, Package } from 'lucide-react';
import { OrderStatusBadge } from '@/components/ui';
import type { OrderStatus } from '@/types';

interface Order {
    _id: string;
    orderNumber: string;
    customer: {
        name: string;
    };
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
}

interface RecentOrdersWidgetProps {
    orders: Order[];
    loading?: boolean;
}

export function RecentOrdersWidget({ orders, loading }: RecentOrdersWidgetProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 animate-pulse">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-24" />
                                <div className="h-3 bg-gray-200 rounded w-32" />
                            </div>
                            <div className="h-6 bg-gray-200 rounded w-16" />
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
                    <Clock className="w-5 h-5 text-gray-400" />
                    Recent Orders
                </h3>
                <Link
                    href="/admin/orders"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                    View all
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent orders</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Link
                            key={order._id}
                            href={`/admin/orders/${order._id}`}
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-primary-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                    {order.orderNumber}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {order.customer.name}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                    ${order.totalAmount.toFixed(2)}
                                </p>
                                <OrderStatusBadge status={order.status} />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
