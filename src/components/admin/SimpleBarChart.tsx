'use client';

import React from 'react';

interface BarData {
    label: string;
    value: number;
    color?: string;
}

interface SimpleBarChartProps {
    data: BarData[];
    height?: number;
    showLabels?: boolean;
    showValues?: boolean;
}

export function SimpleBarChart({
    data,
    height = 200,
    showLabels = true,
    showValues = true,
}: SimpleBarChartProps) {
    const maxValue = Math.max(...data.map(d => d.value));

    const defaultColors = [
        'bg-primary-500',
        'bg-blue-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
    ];

    return (
        <div className="w-full">
            <div
                className="flex items-end justify-between gap-2"
                style={{ height }}
            >
                {data.map((item, index) => {
                    const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                    const colorClass = item.color || defaultColors[index % defaultColors.length];

                    return (
                        <div
                            key={item.label}
                            className="flex-1 flex flex-col items-center gap-2"
                        >
                            {showValues && (
                                <span className="text-xs font-medium text-gray-600">
                                    {item.value}
                                </span>
                            )}
                            <div
                                className={`w-full rounded-t-md transition-all duration-500 ${colorClass}`}
                                style={{ height: `${barHeight}%`, minHeight: barHeight > 0 ? '4px' : '0' }}
                            />
                        </div>
                    );
                })}
            </div>

            {showLabels && (
                <div className="flex justify-between gap-2 mt-2">
                    {data.map((item) => (
                        <div key={item.label} className="flex-1 text-center">
                            <span className="text-xs text-gray-500 truncate block">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
