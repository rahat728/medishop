'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminHeader } from '@/components/layout';
import { Button } from '@/components/ui';
import {
    StockOverview,
    StockUpdateModal,
    StockAlertsList,
    StockByCategory,
    QuickStockUpdate,
} from '@/components/admin/stock';

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

interface StockData {
    medicines: Medicine[];
    summary: {
        totalProducts: number;
        totalStock: number;
        outOfStock: number;
        lowStock: number;
        healthyStock: number;
    };
    byCategory: Array<{
        _id: string;
        count: number;
        totalStock: number;
        outOfStock: number;
        lowStock: number;
    }>;
}

export default function StockManagementPage() {
    const [data, setData] = useState<StockData | null>(null);
    const [loading, setLoading] = useState(true);
    const [updateModal, setUpdateModal] = useState<{
        open: boolean;
        medicine: Medicine | null;
    }>({ open: false, medicine: null });

    const fetchStockData = useCallback(async () => {
        try {
            const response = await fetch('/api/medicines/stock');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch stock data');
            }

            setData(result.data);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStockData();
    }, [fetchStockData]);

    const handleRefresh = () => {
        setLoading(true);
        fetchStockData();
    };

    return (
        <div className="space-y-6">
            <AdminHeader
                title="Stock Management"
                subtitle="Monitor and update your inventory"
                actions={
                    <Button
                        variant="secondary"
                        onClick={handleRefresh}
                        leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                }
            />

            {/* Overview Stats */}
            <StockOverview
                summary={data?.summary || {
                    totalProducts: 0,
                    totalStock: 0,
                    outOfStock: 0,
                    lowStock: 0,
                    healthyStock: 0,
                }}
                loading={loading}
            />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Alerts */}
                <div className="lg:col-span-2 space-y-6">
                    <StockAlertsList
                        medicines={data?.medicines.filter(
                            (m) => m.stock === 0 || m.stock <= m.lowStockThreshold
                        ) || []}
                        loading={loading}
                        onUpdateStock={(medicine) => setUpdateModal({ open: true, medicine })}
                    />

                    {/* Quick Update */}
                    <QuickStockUpdate onSuccess={fetchStockData} />
                </div>

                {/* Right Column - Category Breakdown */}
                <div>
                    <StockByCategory
                        categories={data?.byCategory || []}
                        loading={loading}
                    />
                </div>
            </div>

            {/* Stock Update Modal */}
            <StockUpdateModal
                isOpen={updateModal.open}
                onClose={() => setUpdateModal({ open: false, medicine: null })}
                medicine={updateModal.medicine}
                onSuccess={fetchStockData}
            />
        </div>
    );
}
