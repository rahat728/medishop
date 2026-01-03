'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import {
    ShoppingBag,
    Eye,
    Calendar,
    User,
    Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminHeader } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import { DataTable, RowActions, StatsCard, StatsGrid, type Column } from '@/components/admin';
import { OrderStatusBadge } from './OrderStatusBadge';
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from '@/lib/validations/order';

// =============================================================================
// Types
// =============================================================================

interface Order {
    _id: string;
    orderNumber: string;
    customer: {
        _id: string;
        name: string;
        email: string;
    };
    items: Array<{
        medicine: { name: string };
        quantity: number;
    }>;
    totalAmount: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    deliveryMan?: {
        _id: string;
        name: string;
    };
    createdAt: string;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface OrderStats {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    deliveredOrders: number;
}

// =============================================================================
// Component
// =============================================================================

export function OrderList() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State
    const [orders, setOrders] = useState<Order[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [stats, setStats] = useState<OrderStats>({
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [paymentFilter, setPaymentFilter] = useState(searchParams.get('paymentStatus') || '');

    // =============================================================================
    // Data Fetching
    // =============================================================================

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            if (search) params.set('search', search);
            if (statusFilter) params.set('status', statusFilter);
            if (paymentFilter) params.set('paymentStatus', paymentFilter);

            const response = await fetch(`/api/orders?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch orders');
            }

            setOrders(data.data.orders);
            setPagination(data.data.pagination);
            setStats(data.data.stats);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, statusFilter, paymentFilter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPagination((prev) => ({ ...prev, page: 1 }));
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // =============================================================================
    // Table Columns
    // =============================================================================

    const columns: Column<Order>[] = [
        {
            key: 'orderNumber',
            header: 'Order',
            render: (_, order) => (
                <div>
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">
                        {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                </div>
            ),
        },
        {
            key: 'customer',
            header: 'Customer',
            render: (_, order) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">{order.customer?.name}</p>
                        <p className="text-xs text-gray-500">{order.customer?.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'items',
            header: 'Items',
            render: (_, order) => (
                <div>
                    <p className="text-sm text-gray-900">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[150px]">
                        {order.items.map((item) => item.medicine?.name).join(', ')}
                    </p>
                </div>
            ),
        },
        {
            key: 'totalAmount',
            header: 'Total',
            sortable: true,
            render: (value) => (
                <span className="font-medium text-gray-900">
                    ${value.toFixed(2)}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (value) => <OrderStatusBadge status={value} size="sm" />,
        },
        {
            key: 'paymentStatus',
            header: 'Payment',
            render: (value) => {
                const colors: Record<PaymentStatus, string> = {
                    pending: 'bg-yellow-100 text-yellow-700',
                    paid: 'bg-green-100 text-green-700',
                    failed: 'bg-red-100 text-red-700',
                    refunded: 'bg-gray-100 text-gray-700',
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value]}`}>
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                );
            },
        },
        {
            key: 'deliveryMan',
            header: 'Driver',
            render: (_, order) =>
                order.deliveryMan ? (
                    <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{order.deliveryMan.name}</span>
                    </div>
                ) : (
                    <span className="text-sm text-gray-400 italic">Not assigned</span>
                ),
        },
    ];

    // =============================================================================
    // Row Actions
    // =============================================================================

    const getRowActions = (order: Order) => [
        {
            label: 'View Details',
            icon: Eye,
            onClick: () => router.push(`/admin/orders/${order._id}`),
        },
    ];

    // =============================================================================
    // Render
    // =============================================================================

    return (
        <div className="space-y-6">
            <AdminHeader
                title="Orders"
                subtitle={`${pagination.total} orders total`}
            />

            {/* Stats */}
            <StatsGrid columns={4}>
                <StatsCard
                    title="Total Orders"
                    value={stats.totalOrders}
                    icon={<ShoppingBag className="w-6 h-6 text-blue-600" />}
                    iconBgColor="bg-blue-100"
                />
                <StatsCard
                    title="Total Revenue"
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    icon={<ShoppingBag className="w-6 h-6 text-green-600" />}
                    iconBgColor="bg-green-100"
                />
                <StatsCard
                    title="Pending"
                    value={stats.pendingOrders}
                    icon={<ShoppingBag className="w-6 h-6 text-yellow-600" />}
                    iconBgColor="bg-yellow-100"
                />
                <StatsCard
                    title="Delivered"
                    value={stats.deliveredOrders}
                    icon={<ShoppingBag className="w-6 h-6 text-purple-600" />}
                    iconBgColor="bg-purple-100"
                />
            </StatsGrid>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Statuses</option>
                    {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </option>
                    ))}
                </select>

                <select
                    value={paymentFilter}
                    onChange={(e) => {
                        setPaymentFilter(e.target.value);
                        setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Payments</option>
                    {PAYMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={orders}
                loading={loading}
                emptyMessage="No orders found"
                emptyIcon={ShoppingBag}
                search={{
                    value: search,
                    onChange: setSearch,
                    placeholder: 'Search by order number...',
                }}
                pagination={{
                    page: pagination.page,
                    limit: pagination.limit,
                    total: pagination.total,
                    onPageChange: (page) => setPagination((prev) => ({ ...prev, page })),
                    onLimitChange: (limit) => setPagination((prev) => ({ ...prev, limit, page: 1 })),
                }}
                rowActions={(order) => <RowActions actions={getRowActions(order)} />}
                onRowClick={(order) => router.push(`/admin/orders/${order._id}`)}
            />
        </div>
    );
}
