import Link from 'next/link';
import { Package, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui';

export default function ProductNotFound() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package className="w-12 h-12 text-gray-400" />
                </div>

                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Product Not Found
                </h1>

                <p className="text-lg text-gray-600 mb-10 max-w-md mx-auto">
                    Sorry, we couldn't find the product you're looking for.
                    It may have been removed or the link might be incorrect.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/shop">
                        <Button size="lg" leftIcon={<ArrowLeft className="w-5 h-5" />}>
                            Back to Shop
                        </Button>
                    </Link>
                    <Link href="/shop">
                        <Button size="lg" variant="secondary" leftIcon={<Search className="w-5 h-5" />}>
                            Search Products
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
