'use client';

import React, { useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Modal, ModalFooter } from '@/components/ui';
import { OrderStatusBadge } from './OrderStatusBadge';
import {
    ORDER_STATUS_CONFIG,
    type OrderStatus,
} from '@/lib/validations/order';

interface OrderStatusSelectProps {
    orderId: string;
    currentStatus: OrderStatus;
    onStatusChange: () => void;
}

export function OrderStatusSelect({
    orderId,
    currentStatus,
    onStatusChange,
}: OrderStatusSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const config = ORDER_STATUS_CONFIG[currentStatus];
    const nextStatuses = config.nextStatuses;

    const handleUpdateStatus = async () => {
        if (!selectedStatus) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: selectedStatus,
                    note: note || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update status');
            }

            toast.success(`Order status updated to "${ORDER_STATUS_CONFIG[selectedStatus].label}"`);
            setIsOpen(false);
            setSelectedStatus(null);
            setNote('');
            onStatusChange();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (nextStatuses.length === 0) {
        return (
            <div className="text-sm text-gray-500 italic">
                No further status changes available
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {nextStatuses.map((status) => {
                    const statusConfig = ORDER_STATUS_CONFIG[status];
                    return (
                        <button
                            key={status}
                            onClick={() => {
                                setSelectedStatus(status);
                                setIsOpen(true);
                            }}
                            className={`
                inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 text-sm font-medium
                transition-all hover:shadow-sm
                ${statusConfig.bgColor} ${statusConfig.color} border-current
              `}
                        >
                            Move to {statusConfig.label}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    );
                })}
            </div>

            <Modal
                isOpen={isOpen}
                onClose={() => {
                    setIsOpen(false);
                    setSelectedStatus(null);
                    setNote('');
                }}
                title="Update Order Status"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <OrderStatusBadge status={currentStatus} />
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        {selectedStatus && <OrderStatusBadge status={selectedStatus} />}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Note (optional)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Add a note about this status change..."
                        />
                    </div>
                </div>

                <ModalFooter>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setIsOpen(false);
                            setSelectedStatus(null);
                            setNote('');
                        }}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdateStatus}
                        isLoading={isLoading}
                    >
                        Update Status
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
}
