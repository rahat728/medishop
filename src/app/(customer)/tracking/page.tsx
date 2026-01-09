'use client';

import React, { useState } from 'react';
import { Search, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { TrackingMap } from '@/components/map';

export default function TrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);

  const handleTrack = async () => {
    if (!orderNumber.trim()) {
      toast.error('Please enter an order number');
      return;
    }

    setLoading(true);
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/tracking/${encodeURIComponent(orderNumber.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Order not found');
      setOrder(json.data);
    } catch (e: any) {
      toast.error(e.message || 'Tracking failed');
    } finally {
      setLoading(false);
    }
  };

  const center =
    order?.deliveryLocation?.lat && order?.deliveryLocation?.lng
      ? [order.deliveryLocation.lat, order.deliveryLocation.lng] as [number, number]
      : order?.deliveryAddress?.coordinates?.lat && order?.deliveryAddress?.coordinates?.lng
        ? [order.deliveryAddress.coordinates.lat, order.deliveryAddress.coordinates.lng] as [number, number]
        : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Track Order</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                label="Order Number"
                placeholder="ORD-20240101-ABC123"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </div>
            <div className="pt-6 sm:pt-0 sm:self-end">
              <Button
                onClick={handleTrack}
                isLoading={loading}
                leftIcon={<Search className="w-4 h-4" />}
              >
                Track
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {order && (
        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">{order.orderNumber}</div>
              <div className="text-sm text-gray-600">Status: {String(order.status).replace('_', ' ')}</div>
              {order.deliveryMan?.name && (
                <div className="text-sm text-gray-600 mt-1">Driver: {order.deliveryMan.name}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {order && center && (
        <TrackingMap
          orderId={order._id}
          center={center}
          zoom={14}
        />
      )}
    </div>
  );
}
