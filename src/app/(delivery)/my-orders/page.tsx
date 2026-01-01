import { Package, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

const stats = [
  { label: 'Pending', value: 3, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { label: 'In Progress', value: 1, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
  { label: 'Delivered Today', value: 5, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
];

export default function DeliveryOrdersPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-1">View and manage your assigned deliveries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-2`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Placeholder */}
      <Card>
        <CardContent className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order List</h3>
          <p className="text-gray-500">
            Delivery order management will be implemented in Day 14.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
