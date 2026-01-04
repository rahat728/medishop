'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks';

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
);

import L from 'leaflet';
import { Truck, Package, Clock, Navigation } from 'lucide-react';

// Fix for Leaflet icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowSize: [25, 41],
  shadowAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [1, -38],
  iconSize: [25, 41]
});

interface Driver {
  _id: string;
  name: string;
  currentLocation: {
    type: string;
    coordinates: [number, number];
  };
}

interface TrackingMapProps {
  orderId: string;
  center?: [number, number];
  zoom?: number;
}

export function TrackingMap({ orderId, center, zoom = 13 }: TrackingMapProps) {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activeDriver, setActiveDriver] = useState<Driver | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  // Simulated driver data (would come from API/Socket.io)
  useEffect(() => {
    // In a real app, this would fetch drivers for the order
    // or listen to Socket.io updates
    
    // Mock drivers for demonstration
    const mockDrivers: Driver[] = [
      {
        _id: '1',
        name: 'John Doe',
        currentLocation: { type: 'Point', coordinates: [40.7128, -74.0060] }, // New York
      },
    ];

    setDrivers(mockDrivers);
    if (mockDrivers.length > 0) {
      setActiveDriver(mockDrivers[0]);
    }
  }, [orderId]);

  // Default center (New York)
  const mapCenter: [number, number] = center || [40.7128, -74.0060];
  const mapZoom = zoom;

  // Driver icon
  const DriverIcon = new L.Icon({
    iconUrl: '/icons/truck-icon.svg', // Would use a real truck icon
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  if (!center) {
    return null;
  }

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(mapInstance) => setMap(mapInstance)}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        
        {/* Delivery destination marker */}
        <Marker position={mapCenter}>
          <Popup>
            <div className="text-center">
              <Package className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="font-semibold">Delivery Location</p>
              <p className="text-sm text-gray-500">
                {mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Driver markers */}
        {drivers.map((driver) => (
          driver.currentLocation && (
            <Marker
              key={driver._id}
              position={[
                driver.currentLocation.coordinates[1],
                driver.currentLocation.coordinates[0]
              ]}
              icon={DriverIcon}
            >
              <Popup>
                <div className="text-center">
                  <Truck className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                  <p className="font-semibold">{driver.name}</p>
                  <p className="text-xs text-gray-500">
                    Lat: {driver.currentLocation.coordinates[1].toFixed(4)}
                    <br />
                    Lng: {driver.currentLocation.coordinates[0].toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
