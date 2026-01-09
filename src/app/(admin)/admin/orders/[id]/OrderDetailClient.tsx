'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
    ArrowLeft,
    User,
    MapPin,
    Phone,
    Mail,
    Truck,
    CreditCard,
    StickyNote,
} from 'lucide-react';
import { AdminHeader } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import {
    OrderStatusBadge,
    OrderTimeline,
    OrderStatusSelect,
    OrderItemsList,
    AssignDriverModal,
} from '@/components/admin/orders';
import type { OrderStatus, PaymentStatus } from '@/lib/validations/order';
import toast from 'react-hot-toast';

interface OrderDetailClientProps {
    order: any; // Order type is complex with populated fields
}

export function OrderStatusSelectWrapper({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
    const router = useRouter();
    // Local state to show immediate update if needed, though router.refresh will eventually update props
    // Assuming OrderStatusSelect handles its own loading state or optimistic update visualization 
    // but we can just rely on router.refresh for now as it was in the original client
    return (
        <OrderStatusSelect
            orderId={orderId}
            currentStatus={currentStatus}
            onStatusChange={() => {
                router.refresh();
                toast.success('Status updated');
            }}
        />
    );
}

export function OrderDetailClient({ order }: OrderDetailClientProps) {
    const router = useRouter();
    const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    useEffect(() => {
        setCurrentStatus(order.status);
    }, [order.status]);

    const refreshData = () => {
        router.refresh();
    };

    const handleAssignDriver = async (driverId: string) => {
        const response = await fetch(`/api/orders/${order._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deliveryManId: driverId }),
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to assign driver');
        }
        toast.success('Driver assigned! Order moved to logistics.');
        refreshData();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Orders
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Order {order.orderNumber}
                        </h1>
                        <OrderStatusBadge status={currentStatus} />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Placed on {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                </div>

                <div className="flex gap-3">
                    <OrderStatusSelect
                        orderId={order._id}
                        currentStatus={currentStatus}
                        onStatusChange={() => {
                            // Optimistically update or refresh
                            refreshData();
                        }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Order Items & Payment */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
                        <OrderItemsList
                            items={order.items}
                            subtotal={order.subtotal}
                            deliveryFee={order.deliveryFee}
                            tax={order.tax}
                            discount={order.discount}
                            total={order.totalAmount}
                        />
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <CreditCard className="w-5 h-5 text-gray-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Digital Payment'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-gray-500">Status:</span>
                                    <span
                                        className={`
                      text-xs px-2 py-0.5 rounded-full font-medium
                      ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                                order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'}
                    `}
                                    >
                                        {order.paymentStatus.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column - Customer, Address, Driver, Timeline */}
                <div className="space-y-6">
                    {/* Customer */}
                    <Card className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Customer</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {order.customer?.name}
                                    </p>
                                    <p className="text-sm text-gray-500">Customer</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                <p className="text-sm text-gray-600 break-all">
                                    {order.customer?.email}
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                <p className="text-sm text-gray-600">{order.customer?.phone}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Delivery Address */}
                    <Card className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Address</h3>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {order.deliveryAddress.street}
                                    <br />
                                    {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                                </p>
                            </div>
                        </div>
                        {order.deliveryNotes && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-start gap-2">
                                    <StickyNote className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <p className="text-sm text-gray-500 italic">"{order.deliveryNotes}"</p>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Delivery Man */}
                    <Card className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Details</h3>
                        {order.deliveryMan ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {order.deliveryMan.name}
                                        </p>
                                        <p className="text-sm text-gray-500">Delivery Partner</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <p className="text-sm text-gray-600">{order.deliveryMan.phone}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <Truck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No delivery partner assigned</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => setIsAssignModalOpen(true)}
                                >
                                    Assign Driver
                                </Button>
                            </div>
                        )}

                        {order.deliveryMan && (
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full mt-4"
                                onClick={() => setIsAssignModalOpen(true)}
                            >
                                Change Driver
                            </Button>
                        )}
                    </Card>

                    <AssignDriverModal
                        isOpen={isAssignModalOpen}
                        onClose={() => setIsAssignModalOpen(false)}
                        onAssign={handleAssignDriver}
                        currentDriverId={order.deliveryMan?._id}
                    />

                    {/* Timeline */}
                    <Card className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Order History</h3>
                        <OrderTimeline
                            history={order.statusHistory}
                            currentStatus={order.status}
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
}
