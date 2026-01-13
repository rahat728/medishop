import { z } from 'zod';

// =============================================================================
// Order Status
// =============================================================================

export const ORDER_STATUSES = [
    'pending',
    'confirmed',
    'assigned',
    'picked_up',
    'on_the_way',
    'delivered',
    'cancelled',
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export const PAYMENT_STATUSES = [
    'pending',
    'paid',
    'failed',
    'refunded',
] as const;

export type PaymentStatus = typeof PAYMENT_STATUSES[number];

// =============================================================================
// Status Flow Configuration
// =============================================================================

export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
    label: string;
    color: string;
    bgColor: string;
    nextStatuses: OrderStatus[];
}> = {
    pending: {
        label: 'Pending',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100',
        nextStatuses: ['confirmed', 'cancelled'],
    },
    confirmed: {
        label: 'Confirmed',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        nextStatuses: ['assigned', 'cancelled'],
    },
    assigned: {
        label: 'Assigned',
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        nextStatuses: ['picked_up', 'cancelled'],
    },
    picked_up: {
        label: 'Picked Up',
        color: 'text-orange-700',
        bgColor: 'bg-orange-100',
        nextStatuses: ['on_the_way'],
    },
    on_the_way: {
        label: 'On The Way',
        color: 'text-cyan-700',
        bgColor: 'bg-cyan-100',
        nextStatuses: ['delivered'],
    },
    delivered: {
        label: 'Delivered',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        nextStatuses: [],
    },
    cancelled: {
        label: 'Cancelled',
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        nextStatuses: [],
    },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, {
    label: string;
    color: string;
    bgColor: string;
}> = {
    pending: {
        label: 'Pending',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100',
    },
    paid: {
        label: 'Paid',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
    },
    failed: {
        label: 'Failed',
        color: 'text-red-700',
        bgColor: 'bg-red-100',
    },
    refunded: {
        label: 'Refunded',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100',
    },
};

// =============================================================================
// Query Schema
// =============================================================================

export const orderQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
    status: z.enum(ORDER_STATUSES).optional(),
    paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
    customerId: z.string().optional(),
    deliveryManId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.enum(['createdAt', 'totalAmount', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    type: z.enum(['all', 'logistics']).optional(),
});

export type OrderQuery = z.infer<typeof orderQuerySchema>;

// =============================================================================
// Update Status Schema
// =============================================================================

export const updateOrderStatusSchema = z.object({
    status: z.enum(ORDER_STATUSES),
    note: z.string().max(500).optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// =============================================================================
// Create Order Schema
// =============================================================================

export const createOrderSchema = z.object({
    items: z.array(z.object({
        medicine: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid medicine ID'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    })).min(1, 'Order must have at least one item'),
    shippingAddress: z.object({
        street: z.string().min(5, 'Street address is required'),
        city: z.string().min(2, 'City is required'),
        state: z.string().min(2, 'State is required'),
        zipCode: z.string().min(5, 'ZIP code is required'),
        wardNo: z.string().optional(),
    }),
    paymentMethod: z.enum(['stripe', 'cod']),
    notes: z.string().max(1000).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

