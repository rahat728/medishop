'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

type LocationSharingState = 'idle' | 'starting' | 'sharing' | 'error';

interface LocationPayload {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

export function useLocationSharing(options?: {
  orderId?: string;
  minIntervalMs?: number; // throttle API calls
}) {
  const orderId = options?.orderId;
  const minIntervalMs = options?.minIntervalMs ?? 5000;

  const watchIdRef = useRef<number | null>(null);
  const lastSentAtRef = useRef<number>(0);

  const [state, setState] = useState<LocationSharingState>('idle');
  const [lastLocation, setLastLocation] = useState<LocationPayload | null>(null);
  const [lastServerAckAt, setLastServerAckAt] = useState<number | null>(null);

  const canUseGeolocation = useMemo(
    () => typeof window !== 'undefined' && !!navigator.geolocation,
    []
  );

  const stop = useCallback(() => {
    if (watchIdRef.current !== null && canUseGeolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState('idle');
  }, [canUseGeolocation]);

  const sendToServer = useCallback(
    async (lat: number, lng: number) => {
      const now = Date.now();
      if (now - lastSentAtRef.current < minIntervalMs) return;

      lastSentAtRef.current = now;

      const res = await fetch('/api/location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, orderId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update location');
      }

      setLastServerAckAt(Date.now());
    },
    [orderId, minIntervalMs]
  );

  const start = useCallback(async () => {
    if (!canUseGeolocation) {
      toast.error('Geolocation is not supported on this device/browser.');
      setState('error');
      return;
    }

    setState('starting');

    try {
      // Start watching
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          setLastLocation({
            lat,
            lng,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          });

          try {
            await sendToServer(lat, lng);
          } catch (e: any) {
            // Don’t spam toasts; keep it quiet after first
            console.error(e);
          }

          setState('sharing');
        },
        (err) => {
          console.error('Geolocation error:', err);
          toast.error(err.message || 'Location permission denied');
          setState('error');
          stop();
        },
        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 15000,
        }
      );

      toast.success('Location sharing started');
    } catch (e: any) {
      toast.error(e.message || 'Failed to start location sharing');
      setState('error');
    }
  }, [canUseGeolocation, sendToServer, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    state,
    canUseGeolocation,
    lastLocation,
    lastServerAckAt,
    start,
    stop,
  };
}
