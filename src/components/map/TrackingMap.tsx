'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false });

interface TrackingMapProps {
  orderId: string;
  center: [number, number]; // [lat, lng]
  zoom?: number;
}

// Minimal Leaflet map: destination marker only.
// Customer live marker updates comes Day 18 (polling / maps).
export function TrackingMap({ orderId, center, zoom = 14 }: TrackingMapProps) {
  return (
    <div className="h-[420px] w-full rounded-xl overflow-hidden border border-gray-200">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">Delivery location</div>
              <div className="text-gray-600">Order: {orderId}</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
