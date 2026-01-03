'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface Category {
    name: string;
    slug: string;
    count: number;
    inStock: number;
}

interface CategoryFilterProps {
    categories: Category[];
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    loading?: boolean;
}

export function CategoryFilter({
    categories,
    selectedCategory,
    onCategoryChange,
    loading = false,
}: CategoryFilterProps) {
    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {/* All Categories */}
            <button
                onClick={() => onCategoryChange('')}
                className={`
          w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
          ${selectedCategory === ''
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
        `}
            >
                <span>All Categories</span>
                {selectedCategory === '' && <Check className="w-4 h-4" />}
            </button>

            {/* Individual Categories */}
            {categories.map((category) => (
                <button
                    key={category.slug}
                    onClick={() => onCategoryChange(category.name)}
                    className={`
            w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-colors
            ${selectedCategory === category.name
                            ? 'bg-primary-50 text-primary-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }
          `}
                >
                    <span>{category.name}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                            {category.count}
                        </span>
                        {selectedCategory === category.name && <Check className="w-4 h-4" />}
                    </div>
                </button>
            ))}
        </div>
    );
}
