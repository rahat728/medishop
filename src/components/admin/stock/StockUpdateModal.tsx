'use client';

import React, { useState } from 'react';
import { Package, Plus, Minus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalFooter, Button, Input } from '@/components/ui';

interface Medicine {
    _id: string;
    name: string;
    stock: number;
    image?: string;
}

interface StockUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    medicine: Medicine | null;
    onSuccess: () => void;
}

type StockAction = 'set' | 'add' | 'subtract';

export function StockUpdateModal({
    isOpen,
    onClose,
    medicine,
    onSuccess,
}: StockUpdateModalProps) {
    const [action, setAction] = useState<StockAction>('add');
    const [quantity, setQuantity] = useState<number>(0);
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!medicine) return;

        if (quantity <= 0 && action !== 'set') {
            toast.error('Please enter a valid quantity');
            return;
        }

        if (action === 'set' && quantity < 0) {
            toast.error('Stock cannot be negative');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`/api/medicines/${medicine._id}/stock`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, quantity, reason }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update stock');
            }

            toast.success(data.data.message);
            onSuccess();
            handleClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setAction('add');
        setQuantity(0);
        setReason('');
        onClose();
    };

    const getNewStock = () => {
        if (!medicine) return 0;
        switch (action) {
            case 'set':
                return quantity;
            case 'add':
                return medicine.stock + quantity;
            case 'subtract':
                return Math.max(0, medicine.stock - quantity);
            default:
                return medicine.stock;
        }
    };

    if (!medicine) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Update Stock" size="md">
            <div className="space-y-6">
                {/* Medicine Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                        {medicine.image ? (
                            <img
                                src={medicine.image}
                                alt={medicine.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Package className="w-8 h-8 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">{medicine.name}</h3>
                        <p className="text-sm text-gray-500">
                            Current Stock: <span className="font-semibold text-gray-900">{medicine.stock}</span>
                        </p>
                    </div>
                </div>

                {/* Action Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Action
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => setAction('add')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${action === 'add'
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <Plus className="w-4 h-4" />
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => setAction('subtract')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${action === 'subtract'
                                    ? 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <Minus className="w-4 h-4" />
                            Subtract
                        </button>
                        <button
                            type="button"
                            onClick={() => setAction('set')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${action === 'set'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <RefreshCw className="w-4 h-4" />
                            Set
                        </button>
                    </div>
                </div>

                {/* Quantity Input */}
                <div>
                    <Input
                        label="Quantity"
                        type="number"
                        min="0"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        placeholder="Enter quantity"
                    />
                </div>

                {/* Reason */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason (optional)
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., New shipment received, Inventory adjustment..."
                    />
                </div>

                {/* Preview */}
                <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">New Stock:</span>
                        <span className={`text-2xl font-bold ${getNewStock() === 0
                                ? 'text-red-600'
                                : getNewStock() <= 10
                                    ? 'text-yellow-600'
                                    : 'text-green-600'
                            }`}>
                            {getNewStock()}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <span>{medicine.stock}</span>
                        <span>→</span>
                        <span className="font-medium">{getNewStock()}</span>
                        <span className="text-gray-400">
                            ({action === 'add' ? '+' : action === 'subtract' ? '-' : '='}{quantity})
                        </span>
                    </div>
                </div>
            </div>

            <ModalFooter>
                <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} isLoading={isLoading}>
                    Update Stock
                </Button>
            </ModalFooter>
        </Modal>
    );
}
