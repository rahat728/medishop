'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';

interface SortOption {
    value: string;
    label: string;
}

const sortOptions: SortOption[] = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'price', label: 'Price (Low to High)' },
    { value: 'price-desc', label: 'Price (High to Low)' },
    { value: 'newest', label: 'Newest First' },
    { value: 'popular', label: 'Popular' },
];

interface SortDropdownProps {
    value: string;
    onChange: (value: string) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
    return (
        <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
                {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
