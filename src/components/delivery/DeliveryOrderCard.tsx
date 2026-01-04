'use client';

import React from 'react';
import Link from 'next/link';
import { Package, MapPin, Clock, ArrowRight, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { OrderStatusBadge } from '@/components/admin/orders';
import { format } from 'date-fns';

interface DeliveryOrderCardProps {
    order: any;
}

export function DeliveryOrderCard({ order }: DeliveryOrderCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-0">
                <Link href={`/delivery/orders/${order._id}`}>
                    <div className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">
                                    {order.orderNumber}
                                </p>
                                <p className="text-sm font-medium text-gray-500 mt-0.5">
                                    {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                                </p>
                            </div>
                            <OrderStatusBadge status={order.status} />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 leading-none">Delivery To</p>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                        {order.deliveryAddress.street}, {order.deliveryAddress.city}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                    <Package className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 leading-none">Items</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'} • ${order.totalAmount.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Phone className="w-3 h-3 text-gray-400" />
                                </div>
                                <p className="text-xs font-medium text-gray-600">
                                    {order.customer?.phone || 'No phone'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-bold text-primary-600">
                                Details
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </Link>
            </CardContent>
        </Card>
    );
}
