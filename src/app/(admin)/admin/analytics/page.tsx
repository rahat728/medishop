import React from 'react';
import { Metadata } from 'next';
import { DashboardOverview } from '@/components/admin/DashboardOverview';
import { AdminHeader } from '@/components/layout';

export const metadata: Metadata = {
    title: 'Detailed Analytics | Medishop Admin',
    description: 'Deep dive into business metrics',
};

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <AdminHeader
                title="Business Analytics"
                subtitle="Comprehensive data visualization and trends"
            />
            {/* For now, reusing DashboardOverview but we can expand it later with more detailed charts */}
            <DashboardOverview />
        </div>
    );
}
