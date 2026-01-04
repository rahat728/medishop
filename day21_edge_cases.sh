#!/bin/bash

#==============================================================================
# 🏥 MedDelivery MVP - Day 21: Edge Cases
# Cancel order, refund, payment reconciliation, safe restock
#==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() {
  echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}🔹 $1${NC}"
  echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

show_banner() {
  clear
  echo -e "${CYAN}"
  cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🏥 MedDelivery MVP - Day 21: Edge Cases                   ║
║                                                              ║
║     Today: Cancel, Refund, Payment Sync, Restock              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
  echo -e "${NC}"
}

#==============================================================================
# PHASE 1: Verify Project
#==============================================================================

verify_project() {
  log_step "Phase 1: Verifying Project Setup"

  if [ ! -f "package.json" ]; then
    log_error "package.json not found!"
    read -p "Enter project directory path: " PROJECT_PATH
    if [ -d "$PROJECT_PATH" ]; then
      cd "$PROJECT_PATH"
      log_success "Changed to $PROJECT_PATH"
    else
      log_error "Directory not found."
      exit 1
    fi
  fi

  if [ ! -f "src/lib/db/mongoose.ts" ]; then
    log_error "DB setup missing. Run Day 2."
    exit 1
  fi

  if [ ! -f "src/lib/db/models/Order.ts" ] || [ ! -f "src/lib/db/models/Medicine.ts" ]; then
    log_error "Order/Medicine models missing. Run Day 2."
    exit 1
  fi

  if [ ! -f "src/lib/auth/api-auth.ts" ]; then
    log_error "API auth helpers missing. Run Day 4."
    exit 1
  fi

  if [ ! -f "src/lib/stripe/index.ts" ]; then
    log_warning "Stripe lib not found (Day 12). Refund endpoint will exist but requires Stripe setup."
  fi

  log_success "Project verified!"
}

#==============================================================================
# PHASE 2: Create Restock Utility
#==============================================================================

create_restock_util() {
  log_step "Phase 2: Creating Restock Utility"

  mkdir -p src/lib/orders

  cat > src/lib/orders/restock.ts << 'EOF'
import connectDB from '@/lib/db/mongoose';
import { Order, Medicine } from '@/lib/db/models';

const RESTOCK_NOTE = 'Inventory restocked';

export async function restockOrderItems(orderId: string) {
  await connectDB();

  const order = await Order.findById(orderId).select('items status statusHistory').lean();
  if (!order) {
    throw new Error('Order not found');
  }

  // Idempotency: if already restocked, do nothing
  const already = (order.statusHistory || []).some(
    (h: any) => typeof h?.note === 'string' && h.note.includes(RESTOCK_NOTE)
  );
  if (already) {
    return { restocked: false, message: 'Already restocked' };
  }

  const items = (order.items || []).filter((it: any) => it?.medicine && it?.quantity > 0);

  // Restock medicines
  for (const item of items) {
    await Medicine.updateOne(
      { _id: item.medicine },
      { $inc: { stock: item.quantity } }
    );
  }

  // Record restock in statusHistory using current status (must match enum)
  await Order.updateOne(
    { _id: orderId },
    {
      $push: {
        statusHistory: {
          status: order.status,
          timestamp: new Date(),
          note: RESTOCK_NOTE,
        },
      },
    }
  );

  return { restocked: true, count: items.length };
}
EOF

  log_success "Restock utility created!"
}

#==============================================================================
# PHASE 3: Customer Cancel API
#==============================================================================

create_customer_cancel_api() {
  log_step "Phase 3: Creating Customer Cancel API"

  mkdir -p "src/app/api/orders/[id]/cancel"

  cat > "src/app/api/orders/[id]/cancel/route.ts" << 'EOF'
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAuth } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { restockOrderItems } from '@/lib/orders/restock';

export const POST = withAuth(async (request: NextRequest, { user, params }) => {
  try {
    await connectDB();

    const id = params?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid order ID', 400);
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 200) : 'Customer cancelled';

    const order = await Order.findById(id);
    if (!order) return notFoundResponse('Order not found');

    // Customer ownership check
    if (String(order.customer) !== user.id) {
      return errorResponse('Forbidden', 403);
    }

    // Customer cancellation rules (safe):
    // - Only if status is pending or confirmed
    // - Only if NOT assigned to a delivery man yet
    // - Only if not paid via Stripe yet
    const cancellableStatuses = ['pending', 'confirmed'] as const;

    if (!cancellableStatuses.includes(order.status as any)) {
      return errorResponse('Order can no longer be cancelled', 400);
    }

    if (order.deliveryMan) {
      return errorResponse('Order is already assigned and cannot be cancelled by customer', 400);
    }

    if (order.paymentMethod === 'stripe' && order.paymentStatus === 'paid') {
      return errorResponse('Paid orders require admin cancellation/refund', 400);
    }

    if (order.status === 'cancelled') {
      return successResponse({ _id: order._id.toString() }, 'Order already cancelled');
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason,
    });

    await order.save();

    // Restock (idempotent)
    await restockOrderItems(order._id.toString());

    return successResponse({ _id: order._id.toString() }, 'Order cancelled');
  } catch (error) {
    return serverErrorResponse(error);
  }
});
EOF

  log_success "Customer cancel API created!"
}

#==============================================================================
# PHASE 4: Admin Cancel + Refund + Sync APIs
#==============================================================================

create_admin_edgecase_apis() {
  log_step "Phase 4: Creating Admin Edge Case APIs"

  mkdir -p "src/app/api/admin/orders/[id]/cancel"
  mkdir -p "src/app/api/admin/orders/[id]/refund"
  mkdir -p "src/app/api/admin/orders/[id]/sync-payment"

  # Admin cancel
  cat > "src/app/api/admin/orders/[id]/cancel/route.ts" << 'EOF'
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { restockOrderItems } from '@/lib/orders/restock';

export const POST = withAdmin(async (request: NextRequest, { user, params }) => {
  try {
    await connectDB();

    const id = params?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid order ID', 400);
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 200) : 'Admin cancelled';
    const restock = body?.restock !== false; // default true

    const order = await Order.findById(id);
    if (!order) return notFoundResponse('Order not found');

    if (order.status === 'delivered') {
      return errorResponse('Delivered orders cannot be cancelled', 400);
    }

    if (order.status === 'cancelled') {
      return successResponse({ _id: order._id.toString() }, 'Order already cancelled');
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason,
      updatedBy: new mongoose.Types.ObjectId(user.id),
    });

    await order.save();

    if (restock) {
      await restockOrderItems(order._id.toString());
    }

    return successResponse({ _id: order._id.toString() }, 'Order cancelled (admin)');
  } catch (error) {
    return serverErrorResponse(error);
  }
});
EOF

  # Admin refund (Stripe)
  cat > "src/app/api/admin/orders/[id]/refund/route.ts" << 'EOF'
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { stripe } from '@/lib/stripe';
import { restockOrderItems } from '@/lib/orders/restock';

export const POST = withAdmin(async (request: NextRequest, { user, params }) => {
  try {
    await connectDB();

    const id = params?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid order ID', 400);
    }

    const body = await request.json().catch(() => ({}));
    const amount = typeof body?.amount === 'number' ? body.amount : null; // dollars
    const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 200) : 'Admin refund';
    const cancelOrder = body?.cancelOrder !== false; // default true
    const restock = body?.restock !== false; // default true

    const order = await Order.findById(id);
    if (!order) return notFoundResponse('Order not found');

    if (order.paymentMethod !== 'stripe') {
      return errorResponse('Refund is only available for Stripe payments', 400);
    }

    if (!order.paymentIntentId) {
      return errorResponse('Order has no paymentIntentId', 400);
    }

    if (order.paymentStatus !== 'paid') {
      return errorResponse(`Order paymentStatus must be "paid" to refund. Current: ${order.paymentStatus}`, 400);
    }

    // Stripe refund
    const refundParams: any = {
      payment_intent: order.paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        adminUserId: user.id,
      },
    };

    if (amount !== null) {
      if (amount <= 0) return errorResponse('Refund amount must be > 0', 400);
      refundParams.amount = Math.round(amount * 100); // cents
    }

    const refund = await stripe.refunds.create(refundParams);

    // Update order
    order.paymentStatus = 'refunded';
    order.refundedAt = new Date();
    order.refundAmount = amount !== null ? amount : order.totalAmount;

    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      note: `Refunded via Stripe (${refund.id}). ${reason}`,
      updatedBy: new mongoose.Types.ObjectId(user.id),
    });

    if (cancelOrder && order.status !== 'delivered' && order.status !== 'cancelled') {
      order.status = 'cancelled';
      order.cancelledAt = new Date();
      order.cancellationReason = reason;
      order.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: `Cancelled after refund. ${reason}`,
        updatedBy: new mongoose.Types.ObjectId(user.id),
      });
    }

    await order.save();

    if (cancelOrder && restock && order.status === 'cancelled') {
      await restockOrderItems(order._id.toString());
    }

    return successResponse(
      {
        orderId: order._id.toString(),
        refundId: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
      },
      'Refund created'
    );
  } catch (error: any) {
    return serverErrorResponse(error);
  }
});
EOF

  # Admin sync payment status (Stripe reconcile)
  cat > "src/app/api/admin/orders/[id]/sync-payment/route.ts" << 'EOF'
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response';

function mapStripeToPaymentStatus(piStatus: string) {
  // Very simplified mapping
  switch (piStatus) {
    case 'succeeded':
      return 'paid';
    case 'processing':
    case 'requires_confirmation':
    case 'requires_action':
    case 'requires_payment_method':
      return 'pending';
    case 'canceled':
      return 'failed';
    default:
      return 'pending';
  }
}

export const POST = withAdmin(async (request: NextRequest, { user, params }) => {
  try {
    await connectDB();

    const id = params?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid order ID', 400);
    }

    const order = await Order.findById(id);
    if (!order) return notFoundResponse('Order not found');

    if (order.paymentMethod !== 'stripe') {
      return errorResponse('Only Stripe orders can be synced', 400);
    }

    if (!order.paymentIntentId) {
      return errorResponse('Order has no paymentIntentId', 400);
    }

    const pi = await stripe.paymentIntents.retrieve(order.paymentIntentId);
    const mapped = mapStripeToPaymentStatus(pi.status);

    const prev = order.paymentStatus;
    order.paymentStatus = mapped as any;

    if (mapped === 'paid' && !order.paidAt) {
      order.paidAt = new Date();
    }

    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      note: `Admin sync payment: Stripe PI=${pi.id} status=${pi.status} -> paymentStatus=${mapped} (prev=${prev})`,
      updatedBy: new mongoose.Types.ObjectId(user.id),
    });

    await order.save();

    return successResponse(
      { orderId: order._id.toString(), paymentIntentStatus: pi.status, prevPaymentStatus: prev, paymentStatus: order.paymentStatus },
      'Payment status synced'
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
});
EOF

  log_success "Admin cancel/refund/sync APIs created!"
}

#==============================================================================
# PHASE 5: Admin Order Detail UI Actions (Cancel/Refund)
#==============================================================================

create_admin_order_actions_client() {
  log_step "Phase 5: Creating Admin Order Actions Client Component"

  # CORRECTED PATH: /admin/admin/orders/[id]
  mkdir -p "src/app/(admin)/admin/orders/[id]"

  cat > "src/app/(admin)/admin/orders/[id]/OrderActionsClient.tsx" << 'EOF'
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
EOF

  log_success "OrderActionsClient created!"
}

patch_admin_order_detail_page_to_include_actions() {
  log_step "Phase 6: Patching Admin Order Detail Page to show actions"

  # CORRECTED PATH: /admin/admin/orders/[id]/page.tsx
  if [ ! -f "src/app/(admin)/admin/orders/[id]/page.tsx" ]; then
    log_warning "Admin order detail page not found at corrected path; skipping patch."
    return 0
  fi

  # Updated for Next.js 15: params is synchronous in types (for now) but accessed asynchronously best practice
  # Actually Next.js 15 types dictate params is Promise<{ id: string }>
  cat > "src/app/(admin)/admin/orders/[id]/page.tsx" << 'EOF'
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Mail,
  Truck,
  Calendar,
  CreditCard,
  FileText,
} from 'lucide-react';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { AdminHeader } from '@/components/layout';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import {
  OrderStatusBadge,
  OrderTimeline,
  OrderItemsList,
} from '@/components/admin/orders';
import { OrderStatusSelectWrapper } from './OrderDetailClient';
import { OrderActionsClient } from './OrderActionsClient';
import { PAYMENT_STATUS_CONFIG, type PaymentStatus, type OrderStatus } from '@/lib/validations/order';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getOrder(id: string) {
  try {
    await connectDB();

    const order = await Order.findById(id)
      .populate('customer', 'name email phone address')
      .populate('deliveryMan', 'name email phone')
      .populate('items.medicine', 'name image price')
      .populate('statusHistory.updatedBy', 'name email')
      .lean();

    if (!order) return null;
    return JSON.parse(JSON.stringify(order));
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus as PaymentStatus];

  return (
    <div className="space-y-6">
      <AdminHeader
        title={`Order ${order.orderNumber}`}
        subtitle={`Placed on ${format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}`}
        actions={
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        }
      />

      {/* NEW: Edge-case actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderActionsClient
            orderId={order._id}
            status={order.status}
            paymentStatus={order.paymentStatus}
            paymentMethod={order.paymentMethod}
            paymentIntentId={order.paymentIntentId}
            totalAmount={order.totalAmount}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Status</CardTitle>
                <OrderStatusBadge status={order.status as OrderStatus} size="lg" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <OrderStatusSelectWrapper
                orderId={order._id}
                currentStatus={order.status as OrderStatus}
              />
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderItemsList
                items={order.items}
                subtotal={order.subtotal}
                deliveryFee={order.deliveryFee}
                tax={order.tax}
                discount={order.discount}
                total={order.totalAmount}
              />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline
                history={order.statusHistory || []}
                currentStatus={order.status as OrderStatus}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-gray-900">{order.customer?.name}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                {order.customer?.email}
              </div>
              {order.customer?.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {order.customer.phone}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <address className="not-italic text-sm text-gray-600 space-y-1">
                <p>{order.deliveryAddress?.street}</p>
                <p>
                  {order.deliveryAddress?.city}, {order.deliveryAddress?.state}{' '}
                  {order.deliveryAddress?.zipCode}
                </p>
              </address>
              {order.deliveryNotes && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs font-medium text-yellow-800 mb-1">Delivery Notes</p>
                  <p className="text-sm text-yellow-700">{order.deliveryNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Man */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-gray-400" />
                Delivery Partner
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.deliveryMan ? (
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{order.deliveryMan.name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    {order.deliveryMan.phone || 'No phone'}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Truck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Not assigned yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-400" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentConfig.bgColor} ${paymentConfig.color}`}>
                  {paymentConfig.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Method</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {order.paymentMethod}
                </span>
              </div>
              {order.paymentIntentId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">PaymentIntent</span>
                  <span className="text-xs font-mono text-gray-500">
                    {order.paymentIntentId.slice(0, 20)}...
                  </span>
                </div>
              )}
              {order.paidAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Paid on</span>
                  <span className="text-sm text-gray-900">
                    {format(new Date(order.paidAt), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
EOF

  log_success "Admin order detail page updated with Actions card!"
}

#==============================================================================
# PHASE 7: Verification + Git Commit
#==============================================================================

verify_setup() {
  log_step "Phase 7: Verification"

  local files=(
    "src/lib/orders/restock.ts"
    "src/app/api/orders/[id]/cancel/route.ts"
    "src/app/api/admin/orders/[id]/cancel/route.ts"
    "src/app/api/admin/orders/[id]/refund/route.ts"
    "src/app/api/admin/orders/[id]/sync-payment/route.ts"
    "src/app/(admin)/admin/orders/[id]/OrderActionsClient.tsx"
  )

  local all_good=true
  for file in "${files[@]}"; do
    if [ -f "$file" ]; then
      echo -e "  ${GREEN}✓${NC} $file"
    else
      echo -e "  ${RED}✗${NC} $file"
      all_good=false
    fi
  done

  if [ "$all_good" = true ]; then
    log_success "All Day 21 files created!"
  else
    log_warning "Some files are missing."
  fi
}

git_commit() {
  log_step "Phase 8: Git Commit"

  if [ -d ".git" ]; then
    git add .
    git commit -m "Day 21: Edge cases (cancel/refund/payment sync)

- Added customer cancel endpoint with safe rules
- Added admin cancel endpoint with optional restock
- Added admin Stripe refund endpoint (optional partial)
- Added admin payment sync endpoint (Stripe reconcile)
- Added idempotent restock utility (statusHistory marker)
- Added admin order detail actions (Cancel / Refund / Sync)"
    log_success "Committed changes!"
  else
    log_warning "Not a git repository, skipping commit"
  fi
}

show_completion() {
  log_step "✅ Day 21 Complete!"
  echo ""
  echo -e "${YELLOW}New APIs:${NC}"
  echo "  • POST /api/orders/:id/cancel                       (customer)"
  echo "  • POST /api/admin/orders/:id/cancel                 (admin)"
  echo "  • POST /api/admin/orders/:id/refund                 (admin, Stripe)"
  echo "  • POST /api/admin/orders/:id/sync-payment           (admin, Stripe)"
  echo ""
  echo -e "${YELLOW}Rules:${NC}"
  echo "  • Customer can cancel only if: status=pending|confirmed, not assigned, not paid via Stripe"
  echo "  • Admin can cancel any non-delivered order"
  echo "  • Refund requires: paymentMethod=stripe, paymentStatus=paid, paymentIntentId present"
  echo ""
  echo -e "${YELLOW}UI:${NC}"
  echo "  • Admin order detail now shows: Sync Payment / Cancel / Refund"
  echo ""
  echo -e "${YELLOW}Next (Day 22):${NC}"
  echo "  • UI polish (loading states, empty states, consistent badges)"
  echo ""
}

#==============================================================================
# Main
#==============================================================================

main() {
  show_banner
  verify_project
  create_restock_util
  create_customer_cancel_api
  create_admin_edgecase_apis
  create_admin_order_actions_client
  patch_admin_order_detail_page_to_include_actions
  verify_setup
  git_commit
  show_completion
}

main
