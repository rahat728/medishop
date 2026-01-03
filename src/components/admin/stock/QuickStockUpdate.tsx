'use client';

import React, { useState } from 'react';
import { Plus, Minus, Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';

interface Medicine {
    _id: string;
    name: string;
    stock: number;
    image?: string;
}

interface QuickStockUpdateProps {
    onSuccess: () => void;
}

export function QuickStockUpdate({ onSuccess }: QuickStockUpdateProps) {
    const [search, setSearch] = useState('');
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(false);
    const [updates, setUpdates] = useState<Record<string, number>>({});
    const [updating, setUpdating] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!search.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/medicines?search=${encodeURIComponent(search)}&limit=5`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to search medicines');
            }

            setMedicines(data.data.medicines);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickUpdate = async (medicine: Medicine, action: 'add' | 'subtract') => {
        const quantity = updates[medicine._id] || 1;

        if (action === 'subtract' && medicine.stock < quantity) {
            toast.error('Cannot subtract more than current stock');
            return;
        }

        setUpdating(medicine._id);
        try {
            const response = await fetch(`/api/medicines/${medicine._id}/stock`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, quantity }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update stock');
            }

            toast.success(`Stock ${action === 'add' ? 'increased' : 'decreased'} by ${quantity}`);

            // Update local state
            setMedicines((prev) =>
                prev.map((m) =>
                    m._id === medicine._id
                        ? { ...m, stock: action === 'add' ? m.stock + quantity : m.stock - quantity }
                        : m
                )
            );

            setUpdates((prev) => ({ ...prev, [medicine._id]: 1 }));
            onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUpdating(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-400" />
                    Quick Stock Update
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Search */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search medicine..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <Button onClick={handleSearch} isLoading={loading}>
                        Search
                    </Button>
                </div>

                {/* Results */}
                {medicines.length > 0 && (
                    <div className="space-y-3">
                        {medicines.map((medicine) => (
                            <div
                                key={medicine._id}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="w-10 h-10 bg-white rounded overflow-hidden flex items-center justify-center border">
                                    {medicine.image ? (
                                        <img
                                            src={medicine.image}
                                            alt={medicine.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Package className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{medicine.name}</p>
                                    <p className="text-sm text-gray-500">Stock: {medicine.stock}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={updates[medicine._id] || 1}
                                        onChange={(e) =>
                                            setUpdates((prev) => ({
                                                ...prev,
                                                [medicine._id]: parseInt(e.target.value) || 1,
                                            }))
                                        }
                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                    />

                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleQuickUpdate(medicine, 'subtract')}
                                        disabled={updating === medicine._id || medicine.stock === 0}
                                        isLoading={updating === medicine._id}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        size="sm"
                                        onClick={() => handleQuickUpdate(medicine, 'add')}
                                        disabled={updating === medicine._id}
                                        isLoading={updating === medicine._id}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {medicines.length === 0 && search && !loading && (
                    <p className="text-center text-gray-500 py-4">
                        No medicines found. Try a different search.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
