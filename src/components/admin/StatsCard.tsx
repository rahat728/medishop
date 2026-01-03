'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: React.ReactNode;
    iconColor?: string;
    iconBgColor?: string;
    loading?: boolean;
}

export function StatsCard({
    title,
    value,
    change,
    changeLabel = 'vs last period',
    icon,
    iconColor = 'text-primary-600',
    iconBgColor = 'bg-primary-100',
    loading = false,
}: StatsCardProps) {
    const getTrendIcon = () => {
        if (change === undefined || change === 0) {
            return <Minus className="w-3 h-3" />;
        }
        return change > 0 ? (
            <TrendingUp className="w-3 h-3" />
        ) : (
            <TrendingDown className="w-3 h-3" />
        );
    };

    const getTrendColor = () => {
        if (change === undefined || change === 0) return 'text-gray-500';
        return change > 0 ? 'text-green-600' : 'text-red-600';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="space-y-3 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24" />
                        <div className="h-8 bg-gray-200 rounded w-32" />
                        <div className="h-3 bg-gray-200 rounded w-20" />
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {change !== undefined && (
                        <div className={`flex items-center gap-1 mt-2 ${getTrendColor()}`}>
                            {getTrendIcon()}
                            <span className="text-sm font-medium">
                                {change > 0 ? '+' : ''}{change}%
                            </span>
                            <span className="text-xs text-gray-500 ml-1">{changeLabel}</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${iconBgColor}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
