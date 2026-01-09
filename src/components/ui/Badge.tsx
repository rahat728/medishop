'use client';

import React from 'react';
import type { OrderStatus, PaymentStatus } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'orange' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}: BadgeProps) {
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    cyan: 'bg-cyan-100 text-cyan-800',
  };

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium
      ${variants[variant]}
      ${sizes[size]}
      ${className}
    `}>
      {children}
    </span>
  );
}

// Order Status Badge
const orderStatusConfig: Record<OrderStatus, { label: string; variant: BadgeProps['variant'] }> = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'info' },
  assigned: { label: 'Assigned', variant: 'info' },
  picked_up: { label: 'Picked Up', variant: 'warning' },
  on_the_way: { label: 'On The Way', variant: 'info' },
  delivered: { label: 'Delivered', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
};

export function OrderStatusBadge({ status, size = 'md' }: { status: OrderStatus; size?: BadgeProps['size'] }) {
  const config = orderStatusConfig[status];
  if (!config) {
    return <Badge variant="default" size={size}>{status}</Badge>;
  }
  return <Badge variant={config.variant} size={size}>{config.label}</Badge>;
}

// Payment Status Badge
const paymentStatusConfig: Record<PaymentStatus, { label: string; variant: BadgeProps['variant'] }> = {
  pending: { label: 'Pending', variant: 'warning' },
  paid: { label: 'Paid', variant: 'success' },
  failed: { label: 'Failed', variant: 'error' },
  refunded: { label: 'Refunded', variant: 'info' },
};

export function PaymentStatusBadge({ status, size = 'md' }: { status: PaymentStatus; size?: BadgeProps['size'] }) {
  const config = paymentStatusConfig[status];
  return <Badge variant={config.variant} size={size}>{config.label}</Badge>;
}
