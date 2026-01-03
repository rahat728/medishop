'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
    initialValue?: string;
    onSearch?: (query: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export function SearchBar({
    initialValue = '',
    onSearch,
    placeholder = 'Search medicines...',
    autoFocus = false,
}: SearchBarProps) {
    const [value, setValue] = useState(initialValue);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch?.(value.trim());
        inputRef.current?.blur();
    };

    const handleClear = () => {
        setValue('');
        onSearch?.('');
        inputRef.current?.focus();
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <div className={`
        relative flex items-center bg-white border rounded-xl overflow-hidden transition-all
        ${isFocused ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-gray-200'}
      `}>
                <div className="pl-4">
                    <Search className="w-5 h-5 text-gray-400" />
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className="flex-1 px-3 py-3 text-gray-900 placeholder-gray-400 focus:outline-none"
                />

                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                <button
                    type="submit"
                    className="px-6 py-3 bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                >
                    Search
                </button>
            </div>
        </form>
    );
}
