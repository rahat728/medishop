'use client';

import React from 'react';

interface DataPoint {
    label: string;
    value: number;
}

interface SimpleLineChartProps {
    data: DataPoint[];
    height?: number;
    color?: string;
    showDots?: boolean;
    showLabels?: boolean;
    showGrid?: boolean;
}

export function SimpleLineChart({
    data,
    height = 200,
    color = '#00afaf',
    showDots = true,
    showLabels = true,
    showGrid = true,
}: SimpleLineChartProps) {
    if (data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    const padding = 20;
    const viewBoxWidth = 1000;
    const chartHeight = height - padding * 2;

    const points = data.map((point, index) => {
        const x = (index / (data.length - 1)) * viewBoxWidth;
        const y = ((maxValue - point.value) / range) * chartHeight + padding;
        return { x, y, ...point };
    });

    const pathD = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return (
        <div className="w-full">
            <svg
                viewBox={`0 0 ${viewBoxWidth} ${height}`}
                className="w-full"
                preserveAspectRatio="none"
            >
                {/* Grid lines */}
                {showGrid && (
                    <>
                        {[0, 25, 50, 75, 100].map((y) => (
                            <line
                                key={y}
                                x1="0"
                                y1={padding + (y / 100) * chartHeight}
                                x2={viewBoxWidth}
                                y2={padding + (y / 100) * chartHeight}
                                stroke="#e5e7eb"
                                strokeWidth="1"
                                vectorEffect="non-scaling-stroke"
                            />
                        ))}
                    </>
                )}

                {/* Area fill */}
                <path
                    d={areaD}
                    fill={color}
                    fillOpacity="0.1"
                />

                {/* Line */}
                <path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Dots */}
                {showDots && points.map((point, index) => (
                    <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="white"
                        stroke={color}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                    />
                ))}
            </svg>

            {/* Labels */}
            {showLabels && (
                <div className="flex justify-between mt-2 px-1">
                    {data.map((point, index) => (
                        <span key={index} className="text-xs text-gray-500">
                            {point.label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
