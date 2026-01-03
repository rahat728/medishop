import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser, IAddress } from './User';
import { IMedicine } from './Medicine';

// =============================================================================
// Order Interfaces
// =============================================================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface IOrderItem {
  medicine: mongoose.Types.ObjectId | IMedicine;
  name: string; // Snapshot of medicine name at order time
  price: number; // Snapshot of price at order time
  quantity: number;
  subtotal: number;
}

export interface IStatusHistory {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
  updatedBy?: mongoose.Types.ObjectId;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  customer: mongoose.Types.ObjectId | IUser;
  items: IOrderItem[];

  // Pricing
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  totalAmount: number;

  // Status
  status: OrderStatus;
  statusHistory: IStatusHistory[];

  // Payment
  paymentStatus: PaymentStatus;
  paymentMethod: 'stripe' | 'cod'; // COD for future
  paymentIntentId?: string;
  paidAt?: Date;

  // Delivery
  deliveryMan?: mongoose.Types.ObjectId | IUser;
  deliveryAddress: IAddress;
  deliveryLocation?: {
    lat: number;
    lng: number;
    updatedAt: Date;
  };
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  deliveryNotes?: string;

  // Cancellation/Refund
  cancelledAt?: Date;
  cancellationReason?: string;
  refundedAt?: Date;
  refundAmount?: number;

  // Metadata
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Order Item Schema
// =============================================================================

const OrderItemSchema = new Schema<IOrderItem>(
  {
    medicine: {
      type: Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

// =============================================================================
// Status History Schema
// =============================================================================

const StatusHistorySchema = new Schema<IStatusHistory>(
  {
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'assigned', 'picked_up', 'on_the_way', 'delivered', 'cancelled'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: String,
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: false }
);

// =============================================================================
// Delivery Address Schema (embedded)
// =============================================================================

const DeliveryAddressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false }
);

// =============================================================================
// Order Schema
// =============================================================================

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: function (items: IOrderItem[]) {
          return items.length > 0;
        },
        message: 'Order must have at least one item',
      },
    },

    // Pricing
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'assigned', 'picked_up', 'on_the_way', 'delivered', 'cancelled'],
      default: 'pending',
    },
    statusHistory: [StatusHistorySchema],

    // Payment
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'cod'],
      default: 'stripe',
    },
    paymentIntentId: String,
    paidAt: Date,

    // Delivery
    deliveryMan: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    deliveryAddress: {
      type: DeliveryAddressSchema,
      required: [true, 'Delivery address is required'],
    },
    deliveryLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date,
    },
    estimatedDelivery: Date,
    actualDelivery: Date,
    deliveryNotes: String,

    // Cancellation
    cancelledAt: Date,
    cancellationReason: String,
    refundedAt: Date,
    refundAmount: Number,

    notes: String,
  },
  {
    timestamps: true,
  }
);

// =============================================================================
// Indexes
// =============================================================================

OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ deliveryMan: 1, status: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

// =============================================================================
// Instance Methods
// =============================================================================

OrderSchema.methods.updateStatus = async function (
  newStatus: OrderStatus,
  note?: string,
  updatedBy?: mongoose.Types.ObjectId
) {
  // Validate status transition
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['assigned', 'cancelled'],
    assigned: ['picked_up', 'cancelled'],
    picked_up: ['on_the_way'],
    on_the_way: ['delivered'],
    delivered: [],
    cancelled: [],
  };

  if (!validTransitions[this.status as OrderStatus]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
  }

  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy,
  });

  // Handle special status updates
  if (newStatus === 'delivered') {
    this.actualDelivery = new Date();
  }
  if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
  }

  return this.save();
};

// =============================================================================
// Static Methods
// =============================================================================

OrderSchema.statics.findByCustomer = function (customerId: mongoose.Types.ObjectId) {
  return this.find({ customer: customerId })
    .sort({ createdAt: -1 })
    .populate('items.medicine', 'name image')
    .populate('deliveryMan', 'name phone');
};

OrderSchema.statics.findByDeliveryMan = function (
  deliveryManId: mongoose.Types.ObjectId,
  status?: OrderStatus | OrderStatus[]
) {
  const query: any = { deliveryMan: deliveryManId };
  if (status) {
    query.status = Array.isArray(status) ? { $in: status } : status;
  }
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('customer', 'name phone')
    .populate('items.medicine', 'name image');
};

OrderSchema.statics.findPendingOrders = function () {
  return this.find({ status: 'pending', paymentStatus: 'paid' })
    .sort({ createdAt: 1 })
    .populate('customer', 'name email phone');
};

OrderSchema.statics.getAnalytics = async function (startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' },
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        avgOrderValue: { $avg: '$totalAmount' },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
        },
      },
    },
  ]);
};

// =============================================================================
// Export Model
// =============================================================================

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
