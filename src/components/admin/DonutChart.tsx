'use client';

import React from 'react';

interface DonutData {
    label: string;
    value: number;
    color: string;
}

interface DonutChartProps {
    data: DonutData[];
    size?: number;
    strokeWidth?: number;
    showLegend?: boolean;
    centerLabel?: string;
    centerValue?: string;
}

export function DonutChart({
    data,
    size = 160,
    strokeWidth = 24,
    showLegend = true,
    centerLabel,
    centerValue,
}: DonutChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let cumulativeOffset = 0;

    const segments = data.map((item) => {
        const percentage = total > 0 ? item.value / total : 0;
        const strokeDasharray = `${circumference * percentage} ${circumference * (1 - percentage)}`;
        const strokeDashoffset = -cumulativeOffset;
        cumulativeOffset += circumference * percentage;

        return {
            ...item,
            percentage,
            strokeDasharray,
            strokeDashoffset,
        };
    });

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#f3f4f6"
                        strokeWidth={strokeWidth}
                    />

                    {/* Segments */}
                    {segments.map((segment, index) => (
                        <circle
                            key={segment.label}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={segment.strokeDasharray}
                            strokeDashoffset={segment.strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-500"
                        />
                    ))}
                </svg>

                {/* Center content */}
                {(centerLabel || centerValue) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {centerValue && (
                            <span className="text-2xl font-bold text-gray-900">{centerValue}</span>
                        )}
                        {centerLabel && (
                            <span className="text-sm text-gray-500">{centerLabel}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Legend */}
            {showLegend && (
                <div className="flex flex-wrap justify-center gap-4">
                    {segments.map((segment) => (
                        <div key={segment.label} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: segment.color }}
                            />
                            <span className="text-sm text-gray-600">
                                {segment.label} ({Math.round(segment.percentage * 100)}%)
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
