'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store';

interface CartIconProps {
    onClick?: () => void;
    asLink?: boolean;
}

export function CartIcon({ onClick, asLink = false }: CartIconProps) {
    const itemCount = useCartStore((state) => state.getItemCount());

    const content = (
        <div className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors">
            <ShoppingCart className="w-6 h-6" />
            {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                </span>
            )}
        </div>
    );

    if (asLink) {
        return <Link href="/cart">{content}</Link>;
    }

    return (
        <button onClick={onClick} className="focus:outline-none">
            {content}
        </button>
    );
}
