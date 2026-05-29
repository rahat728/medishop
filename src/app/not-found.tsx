'use client';

import Link from 'next/link';
import { Search, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Search className="w-12 h-12 text-primary-600" />
                </div>

                <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                    The page you are looking for doesn't exist or has been moved.
                    Let's get you back on track.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/">
                        <Button size="lg" leftIcon={<Home className="w-5 h-5" />}>
                            Go Home
                        </Button>
                    </Link>
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => window.history.back()}
                        leftIcon={<ArrowLeft className="w-5 h-5" />}
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
}
