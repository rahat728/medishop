'use client';

import React from 'react';

interface MiniStatsCardProps {
    label: string;
    value: string | number;
    color?: 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'purple';
    icon?: React.ReactNode;
}

const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
};

export function MiniStatsCard({
    label,
    value,
    color = 'primary',
    icon
}: MiniStatsCardProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-100 p-4 text-center">
            {icon && (
                <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]} mb-2`}>
                    {icon}
                </div>
            )}
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
        </div>
    );
}
