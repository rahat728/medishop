'use client';

import React from 'react';
import { Button } from '@/components/ui';
import { Home, RefreshCcw } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body className="bg-gray-50">
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl text-red-600">!</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Critical Error</h1>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            We've encountered a serious problem and need to restart the application.
                            We apologize for the inconvenience.
                        </p>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => reset()}
                                className="w-full py-4 rounded-2xl font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-all shadow-lg shadow-primary-200"
                            >
                                <RefreshCcw className="w-5 h-5 mr-2" />
                                Retry Application
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => window.location.href = '/'}
                                className="w-full py-3 text-gray-500 hover:text-gray-700"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Go to Homepage
                            </Button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
