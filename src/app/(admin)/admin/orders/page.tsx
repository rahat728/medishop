import React from 'react';
import { Metadata } from 'next';
import { OrderList } from '@/components/admin/orders';

export const metadata: Metadata = {
    title: 'Orders | MedicineShop Admin',
    description: 'Manage orders',
};

export default function OrdersPage() {
    return <OrderList />;
}
