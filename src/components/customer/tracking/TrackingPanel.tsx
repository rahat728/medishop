'use client';

import React, { useMemo } from 'react';
import { MapPin, Truck, Phone, Clock } from 'lucide-react';
import { Badge, Card, CardContent } from '@/components/ui';
import { haversineKm, estimateEtaMinutes, formatEta } from '@/lib/geo';
import type { OrderTrackingData } from '@/hooks/useOrderTracking';

export function TrackingPanel({ data }: { data: OrderTrackingData }) {
  const destination = data.destinationCoords;
  const driver = data.driverCoords ? { lat: data.driverCoords.lat, lng: data.driverCoords.lng } : null;

  const eta = useMemo(() => {
    if (!destination || !driver) return null;
    const km = haversineKm(destination, driver);
    const mins = estimateEtaMinutes(km, 25);
    return { km, mins };
  }, [destination, driver]);

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-gray-500">Order</div>
            <div className="text-lg font-semibold text-gray-900">{data.orderNumber}</div>
          </div>
          <div className="flex gap-2">
            {data.isEmergency && (
              <Badge variant="error" className="bg-red-500 text-white border-transparent flex gap-1 items-center font-bold px-2 py-1">
                <span className="text-xs">🚑</span> Emergency (30m)
              </Badge>
            )}
            <Badge variant="info" className="capitalize">
              {String(data.status).replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-gray-900">Destination</div>
              <div className="text-sm text-gray-600">
                Ward No: {data.deliveryAddress?.wardNo || '—'}
                {data.deliveryAddress?.street && (
                  <div className="text-xs text-gray-500">
                    {data.deliveryAddress.street}, {data.deliveryAddress.city}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Truck className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-gray-900">Driver</div>
              <div className="text-sm text-gray-600">
                {data.deliveryMan?.name || 'Not assigned'}
              </div>
              {data.deliveryMan?.phone && (
                <a className="text-xs text-primary-600" href={`tel:${data.deliveryMan.phone}`}>
                  <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> Call</span>
                </a>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-gray-900">ETA</div>
              <div className="text-sm text-gray-600">
                {eta ? formatEta(eta.mins) : '—'}
              </div>
              {eta && (
                <div className="text-xs text-gray-500">
                  ~{eta.km.toFixed(1)} km away (approx.)
                </div>
              )}
            </div>
          </div>
        </div>

        {data.driverCoords?.updatedAt && (
          <div className="text-xs text-gray-500">
            Driver location updated: {new Date(data.driverCoords.updatedAt).toLocaleString()} ({data.driverCoords.source})
          </div>
        )}
      </CardContent>
    </Card>
  );
}
