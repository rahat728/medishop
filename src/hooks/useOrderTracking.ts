'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface OrderTrackingData {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  destinationCoords: { lat: number; lng: number } | null;
  driverCoords: { lat: number; lng: number; updatedAt?: string; source?: string } | null;
  deliveryAddress: any;
  deliveryMan: { _id: string; name: string; phone?: string } | null;
  updatedAt?: string;
}

export function useOrderTracking(orderId: string, intervalMs: number = 5000) {
  const [data, setData] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  const fetchOnce = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}/tracking`, { cache: 'no-store' as any });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load tracking data');
    return json.data as OrderTrackingData;
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const first = await fetchOnce();
        if (!cancelled) setData(first);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Tracking failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    timerRef.current = setInterval(async () => {
      try {
        const next = await fetchOnce();
        if (!cancelled) setData(next);
      } catch {
        // keep last state; avoid spamming errors
      }
    }, intervalMs);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchOnce, intervalMs]);

  return { data, loading, error };
}
