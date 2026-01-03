'use client';

import React from 'react';
import { format } from 'date-fns';
import {
    Clock,
    CheckCircle,
    UserCheck,
    Package,
    Truck,
    CheckCircle2,
    XCircle,
    User,
} from 'lucide-react';
import { ORDER_STATUS_CONFIG, type OrderStatus } from '@/lib/validations/order';

interface StatusHistoryItem {
    status: OrderStatus;
    timestamp: string;
    note?: string;
    updatedBy?: {
        name: string;
        email: string;
    };
}

interface OrderTimelineProps {
    history: StatusHistoryItem[];
    currentStatus: OrderStatus;
}

const statusIcons: Record<OrderStatus, React.ComponentType<{ className?: string }>> = {
    pending: Clock,
    confirmed: CheckCircle,
    assigned: UserCheck,
    picked_up: Package,
    on_the_way: Truck,
    delivered: CheckCircle2,
    cancelled: XCircle,
};

export function OrderTimeline({ history, currentStatus }: OrderTimelineProps) {
    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {history.map((item, index) => {
                    const Icon = statusIcons[item.status];
                    const config = ORDER_STATUS_CONFIG[item.status];
                    const isLast = index === history.length - 1;
                    const isCurrent = item.status === currentStatus;

                    return (
                        <li key={index}>
                            <div className="relative pb-8">
                                {!isLast && (
                                    <span
                                        className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                                        aria-hidden="true"
                                    />
                                )}
                                <div className="relative flex space-x-3">
                                    <div>
                                        <span
                                            className={`
                        h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white
                        ${isCurrent ? config.bgColor : 'bg-gray-100'}
                      `}
                                        >
                                            <Icon
                                                className={`h-4 w-4 ${isCurrent ? config.color : 'text-gray-500'}`}
                                            />
                                        </span>
                                    </div>
                                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                        <div>
                                            <p className={`text-sm ${isCurrent ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                                                {config.label}
                                            </p>
                                            {item.note && (
                                                <p className="mt-0.5 text-sm text-gray-500">{item.note}</p>
                                            )}
                                            {item.updatedBy && (
                                                <p className="mt-0.5 text-xs text-gray-400 flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {item.updatedBy.name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                            <time dateTime={item.timestamp}>
                                                {format(new Date(item.timestamp), 'MMM d, yyyy')}
                                            </time>
                                            <p className="text-xs text-gray-400">
                                                {format(new Date(item.timestamp), 'h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
