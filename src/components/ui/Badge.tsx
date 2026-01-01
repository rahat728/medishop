'use client';

import React from 'react';
import type { OrderStatus, PaymentStatus } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export function Badge({ 
  children, 
  variant = 'default', 
  className = '' 
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${variants[variant]}
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

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = orderStatusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Payment Status Badge
const paymentStatusConfig: Record<PaymentStatus, { label: string; variant: BadgeProps['variant'] }> = {
  pending: { label: 'Pending', variant: 'warning' },
  paid: { label: 'Paid', variant: 'success' },
  failed: { label: 'Failed', variant: 'error' },
  refunded: { label: 'Refunded', variant: 'info' },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = paymentStatusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
