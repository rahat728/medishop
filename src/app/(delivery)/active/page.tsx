import { Navigation, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

export default function DeliveryActivePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Active Delivery</h1>
        <p className="text-gray-500 mt-1">Navigate to your current delivery</p>
      </div>

      {/* Placeholder */}
      <Card>
        <CardContent className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Navigation className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Delivery</h3>
          <p className="text-gray-500 mb-4">
            You don't have an active delivery at the moment.
          </p>
          <p className="text-sm text-blue-600">
            Active delivery navigation will be implemented in Day 16-17.
          </p>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card>
        <CardContent className="p-0">
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Map will appear here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
