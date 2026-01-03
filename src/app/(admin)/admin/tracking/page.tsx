import { MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

export default function AdminTrackingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
        <p className="text-gray-500 mt-1">Monitor all active deliveries in real-time</p>
      </div>

      {/* Placeholder */}
      <Card>
        <CardContent className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Live Tracking Map</h3>
          <p className="text-gray-500">
            Admin live tracking will be implemented in Day 19.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
