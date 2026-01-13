'use client';

import React, { useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

export interface AdminTrackedOrder {
  _id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  driverCoords: { lat: number; lng: number; updatedAt?: string; source?: string } | null;
  destinationCoords: { lat: number; lng: number } | null;
  deliveryMan: { _id: string; name: string; phone?: string } | null;
  customer: { _id: string; name: string; phone?: string } | null;
  deliveryAddress?: any;
}

export function AdminLiveTrackingMap({
  orders,
  selectedOrderId,
  onSelectOrder,
}: {
  orders: AdminTrackedOrder[];
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string | null) => void;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded } = useJsApiLoader({
    id: 'medishop-admin-tracking',
    googleMapsApiKey: apiKey,
  });

  const selected = useMemo(
    () => orders.find((o) => o._id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const defaultCenter = useMemo(() => {
    // Prefer first driver location; else first destination; else fallback NYC
    const firstDriver = orders.find((o) => o.driverCoords)?.driverCoords;
    if (firstDriver) return { lat: firstDriver.lat, lng: firstDriver.lng };
    const firstDest = orders.find((o) => o.destinationCoords)?.destinationCoords;
    if (firstDest) return { lat: firstDest.lat, lng: firstDest.lng };
    return { lat: 40.7128, lng: -74.0060 };
  }, [orders]);

  if (!apiKey) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
        Google Maps API key missing. Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code>.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[520px] w-full rounded-xl border border-gray-200 bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading map…</div>
      </div>
    );
  }

  return (
    <div className="h-[520px] w-full rounded-xl overflow-hidden border border-gray-200">
      <GoogleMap
        center={selected?.driverCoords || selected?.destinationCoords || defaultCenter}
        zoom={13}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
        }}
      >
        {orders.map((o) => {
          const driver = o.driverCoords;
          const dest = o.destinationCoords;

          return (
            <React.Fragment key={o._id}>
              {dest && (
                <Marker
                  position={dest}
                  label={{ text: 'D', color: 'white' }}
                  onClick={() => onSelectOrder(o._id)}
                />
              )}

              {driver && (
                <Marker
                  position={{ lat: driver.lat, lng: driver.lng }}
                  label={{ text: '🚚', color: 'black' }}
                  onClick={() => onSelectOrder(o._id)}
                />
              )}
            </React.Fragment>
          );
        })}

        {selected && (selected.driverCoords || selected.destinationCoords) && (
          <InfoWindow
            position={
              selected.driverCoords
                ? { lat: selected.driverCoords.lat, lng: selected.driverCoords.lng }
                : { lat: selected.destinationCoords!.lat, lng: selected.destinationCoords!.lng }
            }
            onCloseClick={() => onSelectOrder(null)}
          >
            <div className="text-sm">
              <div className="font-semibold">{selected.orderNumber}</div>
              <div className="text-gray-700 capitalize">Status: {String(selected.status).replace('_', ' ')}</div>
              <div className="text-gray-700">Total: ${selected.totalAmount?.toFixed?.(2) ?? selected.totalAmount}</div>
              <div className="mt-2">
                <div className="text-gray-600">Driver: {selected.deliveryMan?.name || 'Not assigned'}</div>
                <div className="text-gray-600">Customer: {selected.customer?.name || 'Unknown'}</div>
              </div>
              {selected.driverCoords?.updatedAt && (
                <div className="mt-2 text-xs text-gray-500">
                  Loc updated: {new Date(selected.driverCoords.updatedAt).toLocaleString()} ({selected.driverCoords.source})
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
