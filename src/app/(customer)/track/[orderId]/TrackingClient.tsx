'use client';

import React from 'react';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { GoogleTrackingMap, TrackingPanel } from '@/components/customer/tracking';
import { Card, CardContent, Spinner } from '@/components/ui';

export function TrackingClient({ orderId }: { orderId: string }) {
  const { data, loading, error } = useOrderTracking(orderId, 5000);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-red-600">
          {error || 'Unable to load tracking data.'}
        </CardContent>
      </Card>
    );
  }

  const destination = data.destinationCoords;
  const driver = data.driverCoords ? { lat: data.driverCoords.lat, lng: data.driverCoords.lng } : null;

  return (
    <div className="space-y-6">
      <TrackingPanel data={data} />
      <GoogleTrackingMap destination={destination} driver={driver} />
    </div>
  );
}
