'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

interface Action {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'default' | 'danger';
    disabled?: boolean;
}

interface RowActionsProps {
    actions: Action[];
}

export function RowActions({ actions }: RowActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                    {actions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    action.onClick();
                                    setIsOpen(false);
                                }}
                                disabled={action.disabled}
                                className={`
                  w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors
                  ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  ${action.variant === 'danger'
                                        ? 'text-red-600 hover:bg-red-50'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }
                `}
                            >
                                {Icon && <Icon className="w-4 h-4" />}
                                {action.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
