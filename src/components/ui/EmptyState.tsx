'use client';

import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            {Icon && (
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-gray-400" />
                </div>
            )}
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            {description && (
                <p className="text-gray-500 max-w-sm mb-8">{description}</p>
            )}
            {action && (
                <Button onClick={action.onClick} variant="primary">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
