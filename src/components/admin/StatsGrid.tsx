'use client';

import React from 'react';

interface StatsGridProps {
    children: React.ReactNode;
    columns?: 2 | 3 | 4;
}

export function StatsGrid({ children, columns = 4 }: StatsGridProps) {
    const gridCols = {
        2: 'sm:grid-cols-2',
        3: 'sm:grid-cols-2 lg:grid-cols-3',
        4: 'sm:grid-cols-2 lg:grid-cols-4',
    };

    return (
        <div className={`grid grid-cols-1 ${gridCols[columns]} gap-6`}>
            {children}
        </div>
    );
}
