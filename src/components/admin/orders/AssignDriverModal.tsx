'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Check, Loader2 } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import toast from 'react-hot-toast';

interface Driver {
    _id: string;
    name: string;
    email: string;
    phone?: string;
}

interface AssignDriverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAssign: (driverId: string) => Promise<void>;
    currentDriverId?: string;
}

export function AssignDriverModal({ isOpen, onClose, onAssign, currentDriverId }: AssignDriverModalProps) {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchDrivers();
        }
    }, [isOpen]);

    const fetchDrivers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/delivery/drivers');
            const data = await response.json();
            if (data.success) {
                setDrivers(data.data);
            } else {
                toast.error(data.error || 'Failed to fetch drivers');
            }
        } catch (error) {
            toast.error('Failed to load delivery partners');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (driverId: string) => {
        setAssigning(driverId);
        try {
            await onAssign(driverId);
            toast.success('Driver assigned successfully');
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to assign driver');
        } finally {
            setAssigning(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Assign Delivery Partner</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center py-12 gap-4">
                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                            <p className="text-sm text-gray-500">Loading delivery partners...</p>
                        </div>
                    ) : drivers.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No active delivery partners found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {drivers.map((driver) => (
                                <button
                                    key={driver._id}
                                    onClick={() => handleAssign(driver._id)}
                                    disabled={assigning !== null}
                                    className={`
                                        w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left
                                        ${currentDriverId === driver._id
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-100 hover:border-primary-200 hover:bg-gray-50'}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                            <User className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{driver.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Phone className="w-3 h-3 text-gray-400" />
                                                <p className="text-xs text-gray-500">{driver.phone || 'No phone set'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {assigning === driver._id ? (
                                        <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                                    ) : currentDriverId === driver._id ? (
                                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 border-2 border-gray-200 rounded-full group-hover:border-primary-300 transition-colors" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <Button variant="secondary" onClick={onClose} disabled={assigning !== null}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}
