'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Button, Modal, ModalFooter, Input } from '@/components/ui';
import { Ban, RefreshCw, Undo2 } from 'lucide-react';

export function OrderActionsClient({
  orderId,
  status,
  paymentStatus,
  paymentMethod,
  paymentIntentId,
  totalAmount,
}: {
  orderId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentIntentId?: string | null;
  totalAmount: number;
}) {
  const router = useRouter();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const [reason, setReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<string>(''); // optional
  const [loading, setLoading] = useState(false);

  const canCancel = status !== 'delivered' && status !== 'cancelled';
  const canRefund =
    paymentMethod === 'stripe' &&
    paymentStatus === 'paid' &&
    !!paymentIntentId;

  const doCancel = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || 'Admin cancelled', restock: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Cancel failed');
      toast.success(json.message || 'Order cancelled');
      setCancelOpen(false);
      setReason('');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Cancel failed');
    } finally {
      setLoading(false);
    }
  };

  const doRefund = async () => {
    setLoading(true);
    try {
      const amt = refundAmount.trim() ? Number(refundAmount) : null;
      if (refundAmount.trim() && (!isFinite(amt!) || amt! <= 0)) {
        throw new Error('Refund amount must be a positive number');
      }

      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason || 'Admin refund',
          amount: amt,
          cancelOrder: true,
          restock: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Refund failed');
      toast.success(json.message || 'Refund created');
      setRefundOpen(false);
      setReason('');
      setRefundAmount('');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Refund failed');
    } finally {
      setLoading(false);
    }
  };

  const doSyncPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/sync-payment`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Sync failed');
      toast.success(json.message || 'Payment synced');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Sync failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        leftIcon={<RefreshCw className="w-4 h-4" />}
        onClick={doSyncPayment}
        disabled={loading || paymentMethod !== 'stripe' || !paymentIntentId}
      >
        Sync Payment
      </Button>

      <Button
        variant="danger"
        leftIcon={<Ban className="w-4 h-4" />}
        onClick={() => setCancelOpen(true)}
        disabled={!canCancel || loading}
      >
        Cancel Order
      </Button>

      <Button
        leftIcon={<Undo2 className="w-4 h-4" />}
        onClick={() => setRefundOpen(true)}
        disabled={!canRefund || loading}
      >
        Refund
      </Button>

      {/* Cancel Modal */}
      <Modal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Order" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          This will cancel the order and restock items (if not already restocked).
        </p>
        <Input
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Customer requested cancellation"
        />
        <ModalFooter>
          <Button variant="secondary" onClick={() => setCancelOpen(false)} disabled={loading}>
            Close
          </Button>
          <Button variant="danger" onClick={doCancel} isLoading={loading}>
            Confirm Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Refund Modal */}
      <Modal isOpen={refundOpen} onClose={() => setRefundOpen(false)} title="Refund (Stripe)" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Full refund is default. Optionally enter a partial refund amount.
        </p>
        <Input
          label="Refund amount (optional)"
          value={refundAmount}
          onChange={(e) => setRefundAmount(e.target.value)}
          placeholder={`Max ${totalAmount.toFixed(2)}`}
        />
        <Input
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Out of stock"
        />
        <ModalFooter>
          <Button variant="secondary" onClick={() => setRefundOpen(false)} disabled={loading}>
            Close
          </Button>
          <Button onClick={doRefund} isLoading={loading} disabled={!canRefund}>
            Confirm Refund
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
