'use client';

import React from 'react';
import {
    ShoppingBag,
    Truck,
    CheckCircle,
    AlertCircle,
    Package,
    User,
    Clock,
} from 'lucide-react';

interface Activity {
    id: string;
    type: 'order_placed' | 'order_delivered' | 'low_stock' | 'new_user' | 'order_cancelled';
    message: string;
    time: string;
}

interface ActivityFeedWidgetProps {
    activities: Activity[];
    loading?: boolean;
}

const activityConfig = {
    order_placed: { icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    order_delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    low_stock: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    new_user: { icon: User, color: 'text-purple-600', bg: 'bg-purple-100' },
    order_cancelled: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
};

export function ActivityFeedWidget({ activities, loading }: ActivityFeedWidgetProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-6" />
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-4 animate-pulse">
                            <div className="w-8 h-8 bg-gray-200 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-200 rounded w-16" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-gray-400" />
                Recent Activity
            </h3>

            {activities.length === 0 ? (
                <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent activity</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {activities.map((activity, index) => {
                        const config = activityConfig[activity.type];
                        const Icon = config.icon;

                        return (
                            <div key={activity.id} className="flex gap-4">
                                <div className="relative">
                                    <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}>
                                        <Icon className={`w-4 h-4 ${config.color}`} />
                                    </div>
                                    {index < activities.length - 1 && (
                                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-100" />
                                    )}
                                </div>
                                <div className="flex-1 pb-4">
                                    <p className="text-sm text-gray-900">{activity.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
