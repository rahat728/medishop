'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/store';

export function SuccessHandler() {
    const clearCart = useCartStore((state: any) => state.clearCart);

    useEffect(() => {
        // Clear local cart store on mount
        clearCart();
        console.log('🛒 Local cart cleared');
    }, [clearCart]);

    return null;
}
