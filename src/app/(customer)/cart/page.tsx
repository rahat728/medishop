import Link from 'next/link';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

export default function CartPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="text-gray-500 mt-2">Review your items before checkout</p>
      </div>

      {/* Empty Cart */}
      <Card>
        <CardContent className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <ShoppingCart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-500 mb-6">
            Cart system will be implemented in Day 10.
          </p>
          <Link href="/shop">
            <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
              Continue Shopping
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
