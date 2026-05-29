'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Admin Error:', error);
    }, [error]);

    return (
        <div className="p-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <ErrorState
                    title="Admin Panel Error"
                    message="There was an error loading this admin section. Please try refreshing or contact support if the problem persists."
                    error={error}
                    reset={reset}
                    showHome={false}
                />
            </div>
        </div>
    );
}
