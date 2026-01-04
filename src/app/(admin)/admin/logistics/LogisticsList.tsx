'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
    Truck,
    Eye,
    Package,
    Navigation,
    User,
    CheckCircle2,
    Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Badge } from '@/components/ui';
import { DataTable, RowActions, StatsCard, StatsGrid, type Column } from '@/components/admin';
import { OrderStatusBadge } from '@/components/admin/orders/OrderStatusBadge';
import { type OrderStatus } from '@/lib/validations/order';

interface Order {
    _id: string;
    orderNumber: string;
    customer: {
        name: string;
    };
    deliveryMan?: {
        name: string;
        phone: string;
    };
    totalAmount: number;
    status: OrderStatus;
    updatedAt: string;
}

export function LogisticsList() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
    });

    const fetchLogistics = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                type: 'logistics',
            });

            const response = await fetch(`/api/orders?${params}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to fetch logistics');

            setOrders(data.data.orders);
            setPagination(prev => ({ ...prev, total: data.data.pagination.total }));
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit]);

    useEffect(() => {
        fetchLogistics();
    }, [fetchLogistics]);

    const columns: Column<Order>[] = [
        {
            key: 'orderNumber',
            header: 'OrderID',
            render: (value) => <span className="font-mono font-medium">{value}</span>,
        },
        {
            key: 'customer',
            header: 'Customer',
            render: (value) => value.name,
        },
        {
            key: 'deliveryMan',
            header: 'Delivery Partner',
            render: (value) => value ? (
                <div className="flex flex-col">
                    <span className="font-medium">{value.name}</span>
                    <span className="text-xs text-gray-500">{value.phone}</span>
                </div>
            ) : (
                <span className="text-gray-400 italic">Unassigned</span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (value) => <OrderStatusBadge status={value} />,
        },
        {
            key: 'updatedAt',
            header: 'Last Update',
            render: (value) => format(new Date(value), 'MMM d, h:mm a'),
        },
    ];

    const getRowActions = (order: Order) => [
        {
            label: 'View Details',
            icon: Eye,
            onClick: () => router.push(`/admin/orders/${order._id}`),
        },
        {
            label: 'Track Order',
            icon: Navigation,
            onClick: () => router.push(`/admin/tracking?orderId=${order._id}`),
        },
    ];

    return (
        <div className="space-y-6">
            <StatsGrid columns={3}>
                <StatsCard
                    title="Active Deliveries"
                    value={orders.length}
                    icon={<Truck className="w-6 h-6 text-blue-600" />}
                    iconBgColor="bg-blue-100"
                />
                <StatsCard
                    title="In Transit"
                    value={orders.filter(o => o.status === 'on_the_way').length}
                    icon={<Navigation className="w-6 h-6 text-purple-600" />}
                    iconBgColor="bg-purple-100"
                />
                <StatsCard
                    title="Picked Up"
                    value={orders.filter(o => o.status === 'picked_up').length}
                    icon={<Package className="w-6 h-6 text-orange-600" />}
                    iconBgColor="bg-orange-100"
                />
            </StatsGrid>

            <DataTable
                columns={columns}
                data={orders}
                loading={loading}
                emptyMessage="No active deliveries at the moment."
                emptyIcon={Truck}
                pagination={{
                    page: pagination.page,
                    limit: pagination.limit,
                    total: pagination.total,
                    onPageChange: (page) => setPagination(prev => ({ ...prev, page })),
                }}
                rowActions={(order) => <RowActions actions={getRowActions(order)} />}
                onRowClick={(order) => router.push(`/admin/orders/${order._id}`)}
            />
        </div>
    );
}
