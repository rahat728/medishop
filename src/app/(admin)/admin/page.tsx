import React from 'react';
import { Metadata } from 'next';
import { DashboardOverview } from '@/components/admin/DashboardOverview';

export const metadata: Metadata = {
    title: 'Dashboard | MedicineShop Admin',
    description: 'Overview of business performance',
};

export default function AdminDashboardPage() {
    return <DashboardOverview />;
}
