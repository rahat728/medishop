'use client';

import React from 'react';
import {
    Clock,
    CheckCircle,
    UserCheck,
    Package,
    Truck,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { ORDER_STATUS_CONFIG, type OrderStatus } from '@/lib/validations/order';

interface OrderStatusBadgeProps {
    status: OrderStatus;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
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

export function OrderStatusBadge({
    status,
    size = 'md',
    showIcon = true,
}: OrderStatusBadgeProps) {
    const config = ORDER_STATUS_CONFIG[status];
    const Icon = statusIcons[status];

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4',
    };

    return (
        <span
            className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${config.bgColor} ${config.color}
        ${sizeClasses[size]}
      `}
        >
            {showIcon && <Icon className={iconSizes[size]} />}
            {config.label}
        </span>
    );
}
