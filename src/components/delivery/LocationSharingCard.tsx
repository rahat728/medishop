'use client';

import React from 'react';
import { MapPin, Wifi, WifiOff } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { useLocationSharing } from '@/hooks/useLocationSharing';

export function LocationSharingCard({ orderId }: { orderId?: string }) {
  const {
    state,
    canUseGeolocation,
    lastLocation,
    lastServerAckAt,
    start,
    stop,
  } = useLocationSharing({ orderId, minIntervalMs: 4000 });

  const statusBadge = () => {
    switch (state) {
      case 'sharing':
        return <Badge variant="success">Sharing</Badge>;
      case 'starting':
        return <Badge variant="warning">Starting…</Badge>;
      case 'error':
        return <Badge variant="error">Error</Badge>;
      default:
        return <Badge variant="default">Off</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            Location Sharing
          </span>
          {statusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canUseGeolocation && (
          <div className="text-sm text-red-600">
            Geolocation is not supported in this browser/device.
          </div>
        )}

        <div className="text-sm text-gray-600">
          {lastLocation ? (
            <div className="space-y-1">
              <div>
                <span className="text-gray-500">Lat:</span> {lastLocation.lat.toFixed(6)}{' '}
                <span className="text-gray-500 ml-2">Lng:</span> {lastLocation.lng.toFixed(6)}
              </div>
              {typeof lastLocation.accuracy === 'number' && (
                <div className="text-xs text-gray-500">
                  Accuracy: ±{Math.round(lastLocation.accuracy)}m
                </div>
              )}
              {lastServerAckAt && (
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-green-600" />
                  Server updated {Math.round((Date.now() - lastServerAckAt) / 1000)}s ago
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 flex items-center gap-2">
              <WifiOff className="w-4 h-4" />
              No location sent yet
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={start}
            disabled={!canUseGeolocation || state === 'starting' || state === 'sharing'}
          >
            Start Sharing
          </Button>
          <Button
            variant="secondary"
            onClick={stop}
            disabled={state !== 'sharing' && state !== 'starting'}
          >
            Stop
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          This will periodically send your GPS to the backend and attach it to your active order (picked up / on the way).
        </p>
      </CardContent>
    </Card>
  );
}
