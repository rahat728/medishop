import React from 'react';
import { Metadata } from 'next';
import { AdminHeader } from '@/components/layout';
import { LogisticsList } from './LogisticsList';

export const metadata: Metadata = {
    title: 'Logistics Management | Medishop Admin',
    description: 'Track and manage active deliveries',
};

export default function LogisticsPage() {
    return (
        <div className="space-y-6">
            <AdminHeader
                title="Logistics Management"
                subtitle="Monitor and manage active delivery operations"
            />
            <LogisticsList />
        </div>
    );
}
