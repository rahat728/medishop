'use client';

import React, { useState, useEffect } from 'react';
import {
    ShoppingBag,
    Users,
    Truck,
    TrendingUp,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    Clock,
    Pill
} from 'lucide-react';
import {
    StatsGrid,
    StatsCard,
    SimpleLineChart,
    DonutChart,
    RecentOrdersWidget,
    LowStockWidget
} from '@/components/admin';
import { Card } from '@/components/ui';
import toast from 'react-hot-toast';

export function DashboardOverview() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats');
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            } else {
                toast.error(data.error || 'Failed to fetch dashboard stats');
            }
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-80 bg-gray-50 rounded-xl" />
                    <div className="h-80 bg-gray-50 rounded-xl" />
                </div>
            </div>
        );
    }

    const revenueData = stats?.revenueTrends?.map((item: any) => ({
        label: item._id.split('-').slice(1).join('/'),
        value: item.revenue
    })) || [];

    const statusData = stats?.statusDistribution?.map((item: any) => {
        const colors: any = {
            delivered: '#10b981',
            pending: '#f59e0b',
            on_the_way: '#3b82f6',
            picked_up: '#6366f1',
            assigned: '#8b5cf6',
            confirmed: '#14b8a6',
            cancelled: '#ef4444'
        };
        return {
            label: item._id.charAt(0).toUpperCase() + item._id.slice(1).replace('_', ' '),
            value: item.count,
            color: colors[item._id] || '#9ca3af'
        };
    }) || [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-500">Welcome back, {stats?.requestedBy}</p>
            </div>

            {/* Stats Overview */}
            <StatsGrid columns={4}>
                <StatsCard
                    title="Total Revenue"
                    value={`$${stats?.todayRevenue.toFixed(2)}`}
                    changeLabel="Today's earnings"
                    icon={<DollarSign className="w-6 h-6 text-green-600" />}
                    iconBgColor="bg-green-100"
                    change={12}
                />
                <StatsCard
                    title="New Orders"
                    value={stats?.todayOrders}
                    changeLabel="Orders today"
                    icon={<ShoppingBag className="w-6 h-6 text-blue-600" />}
                    iconBgColor="bg-blue-100"
                />
                <StatsCard
                    title="Customers"
                    value={stats?.totalCustomers}
                    changeLabel="Active users"
                    icon={<Users className="w-6 h-6 text-purple-600" />}
                    iconBgColor="bg-purple-100"
                />
                <StatsCard
                    title="Deliveries"
                    value={stats?.totalDeliveryMen}
                    changeLabel="Active partners"
                    icon={<Truck className="w-6 h-6 text-orange-600" />}
                    iconBgColor="bg-orange-100"
                />
            </StatsGrid>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend */}
                <Card className="lg:col-span-2 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
                            <p className="text-sm text-gray-500">Last 7 days revenue performance</p>
                        </div>
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="h-64">
                        <SimpleLineChart data={revenueData} color="#10b981" />
                    </div>
                </Card>

                {/* Status Distribution */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Order Status</h3>
                    <div className="h-full flex items-center justify-center">
                        <DonutChart
                            data={statusData}
                            centerValue={stats?.totalOrders.toString()}
                            centerLabel="Total Orders"
                        />
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Selling Medicines */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Top Selling Medicines</h3>
                    <div className="space-y-4">
                        {stats?.topMedicines?.map((med: any) => (
                            <div key={med._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-primary-600 shadow-sm">
                                        {med.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{med.name}</p>
                                        <p className="text-xs text-gray-500">{med.totalQty} units sold</p>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-gray-900">${med.revenue.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Low Stock Alerts */}
                <LowStockWidget medicines={stats?.lowStockMedicines || []} />
            </div>

            {/* Recent Orders */}
            <RecentOrdersWidget orders={stats?.recentOrders || []} />
        </div>
    );
}
