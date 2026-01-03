'use client';

import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { Button } from '@/components/ui';

interface PriceFilterProps {
    minPrice: number;
    maxPrice: number;
    onPriceChange: (min: number, max: number) => void;
}

export function PriceFilter({ minPrice, maxPrice, onPriceChange }: PriceFilterProps) {
    const [min, setMin] = useState(minPrice);
    const [max, setMax] = useState(maxPrice);

    const handleApply = () => {
        onPriceChange(min, max);
    };

    const handleReset = () => {
        const defaultMin = 0;
        const defaultMax = 1000;
        setMin(defaultMin);
        setMax(defaultMax);
        onPriceChange(defaultMin, defaultMax);
    };

    return (
        <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Price Range
            </h4>

            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                        type="number"
                        min="0"
                        value={min === 0 ? '' : min}
                        onChange={(e) => setMin(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Min"
                    />
                </div>
                <span className="text-gray-400">-</span>
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                        type="number"
                        min="0"
                        value={max === 1000 ? '' : max}
                        onChange={(e) => setMax(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Max"
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <Button size="sm" onClick={handleApply} className="flex-1">
                    Apply
                </Button>
                <Button size="sm" variant="secondary" onClick={handleReset}>
                    Reset
                </Button>
            </div>
        </div>
    );
}
