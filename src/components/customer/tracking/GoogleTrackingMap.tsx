'use client';

import React, { useMemo } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

export function GoogleTrackingMap({
  destination,
  driver,
}: {
  destination: { lat: number; lng: number } | null;
  driver: { lat: number; lng: number } | null;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded } = useJsApiLoader({
    id: 'meddelivery-google-maps',
    googleMapsApiKey: apiKey,
  });

  const center = useMemo(() => {
    if (driver) return driver;
    if (destination) return destination;
    return { lat: 40.7128, lng: -74.0060 }; // fallback
  }, [driver, destination]);

  if (!apiKey) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
        Google Maps API key missing. Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code>.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[420px] w-full rounded-xl border border-gray-200 bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading map…</div>
      </div>
    );
  }

  return (
    <div className="h-[420px] w-full rounded-xl overflow-hidden border border-gray-200">
      <GoogleMap
        center={center}
        zoom={14}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
        }}
      >
        {destination && (
          <Marker
            position={destination}
            label={{ text: 'D', color: 'white' }}
          />
        )}

        {driver && (
          <Marker
            position={driver}
            label={{ text: '🚚', color: 'black' }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
