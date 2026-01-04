'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { Truck, CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface DeliveryActionsProps {
    orderId: string;
    currentStatus: string;
}

export function DeliveryActions({ orderId, currentStatus }: DeliveryActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const updateStatus = async (status: string) => {
        setLoading(status);
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to update status');
            }

            toast.success(`Order marked as ${status.replace('_', ' ')}`);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(null);
        }
    };

    if (currentStatus === 'delivered') {
        return (
            <div className="bg-white/10 rounded-xl p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <p className="font-bold">Delivery Completed</p>
                <p className="text-xs text-primary-100 mt-1">This order has been successfully delivered.</p>
            </div>
        );
    }

    if (currentStatus === 'cancelled') {
        return (
            <div className="bg-white/10 rounded-xl p-4 text-center">
                <p className="font-bold">Order Cancelled</p>
                <p className="text-xs text-primary-100 mt-1">This order was cancelled by the customer or admin.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {currentStatus === 'assigned' && (
                <Button
                    className="w-full bg-white text-primary-600 hover:bg-gray-50 py-6 text-lg font-black"
                    onClick={() => updateStatus('picked_up')}
                    disabled={loading !== null}
                    leftIcon={loading === 'picked_up' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
                >
                    Mark as Picked Up
                </Button>
            )}

            {currentStatus === 'picked_up' && (
                <Button
                    className="w-full bg-white text-primary-600 hover:bg-gray-50 py-6 text-lg font-black"
                    onClick={() => updateStatus('on_the_way')}
                    disabled={loading !== null}
                    leftIcon={loading === 'on_the_way' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Truck className="w-5 h-5" />}
                >
                    Start Delivery
                </Button>
            )}

            {currentStatus === 'on_the_way' && (
                <Button
                    className="w-full bg-green-500 text-white hover:bg-green-600 border-none py-6 text-lg font-black shadow-lg shadow-green-900/20"
                    onClick={() => updateStatus('delivered')}
                    disabled={loading !== null}
                    leftIcon={loading === 'delivered' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                >
                    Confirm Delivery
                </Button>
            )}

            <p className="text-[10px] text-primary-200 text-center uppercase font-bold tracking-widest mt-4">
                Update status as you progress
            </p>
        </div>
    );
}
