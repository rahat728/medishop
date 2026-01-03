'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownItem {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'default' | 'danger';
    disabled?: boolean;
}

interface DropdownProps {
    trigger: React.ReactNode;
    items: DropdownItem[];
    align?: 'left' | 'right';
    width?: string;
}

export function Dropdown({
    trigger,
    items,
    align = 'right',
    width = 'w-48',
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="cursor-pointer"
            >
                {trigger}
            </div>

            {isOpen && (
                <div
                    className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 ${width} bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200`}
                >
                    {items.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    item.onClick();
                                    setIsOpen(false);
                                }}
                                disabled={item.disabled}
                                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                  ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  ${item.variant === 'danger'
                                        ? 'text-red-600 hover:bg-red-50'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }
                `}
                            >
                                {Icon && <Icon className="w-4 h-4" />}
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
