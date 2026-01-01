import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

export default function CustomerOrdersPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-2">Track and manage your orders</p>
      </div>

      {/* Placeholder */}
      <Card>
        <CardContent className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
          <p className="text-gray-500">
            Order history and tracking will be implemented in Day 13 & 18.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
