'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('App Error:', error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <ErrorState
                error={error}
                reset={reset}
            />
        </div>
    );
}
