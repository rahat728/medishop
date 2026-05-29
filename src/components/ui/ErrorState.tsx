'use client';

import React from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Button } from './Button';
import Link from 'next/link';

interface ErrorStateProps {
    title?: string;
    message?: string;
    error?: Error & { digest?: string };
    reset?: () => void;
    showHome?: boolean;
}

export function ErrorState({
    title = 'Something went wrong',
    message = 'An unexpected error occurred. We have been notified and are working to fix it.',
    error,
    reset,
    showHome = true,
}: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-500 max-w-md mb-8">{message}</p>

            {error?.digest && (
                <p className="text-xs text-gray-400 mb-6 font-mono">
                    Error ID: {error.digest}
                </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4">
                {reset && (
                    <Button
                        onClick={reset}
                        variant="primary"
                        leftIcon={<RefreshCcw className="w-4 h-4" />}
                    >
                        Try Again
                    </Button>
                )}

                {showHome && (
                    <Link href="/">
                        <Button
                            variant="secondary"
                            leftIcon={<Home className="w-4 h-4" />}
                        >
                            Back to Home
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
}
