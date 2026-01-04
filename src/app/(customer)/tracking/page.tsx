'use client';

import React, { useState, useEffect } from 'react';
import { Package, Search, MapPin } from 'lucide-react';
import { AdminHeader } from '@/components/layout';
import { Button, Input, Card, CardContent, Spinner } from '@/components/ui';
import { TrackingMap } from '@/components/map';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';

export default function TrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');

  const handleTrack = async () => {
    if (!orderNumber.trim()) {
      setError('Please enter an order number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/orders/tracking/${orderNumber}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Order not found');
      }

      setOrder(data.data);
    } catch (err: any) {
      setError(err.message);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AdminHeader
        title="Track Order"
        subtitle="Enter your order number to see real-time delivery status"
      />

      <div className="space-y-6">
        {/* Search Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  label="Order Number"
                  placeholder="e.g., ORD-20240115-ABC123"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleTrack();
                    }
                  }}
                />
                {error && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
              </div>
              <Button
                onClick={handleTrack}
                isLoading={loading}
                leftIcon={<Search className="w-4 h-4" />}
              >
                Track
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        {order && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">
                      Status: {order.status}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            {order.deliveryAddress && (
              <TrackingMap
                orderId={order._id}
                center={[
                  order.deliveryAddress.latitude,
                  order.deliveryAddress.longitude,
                ]}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
