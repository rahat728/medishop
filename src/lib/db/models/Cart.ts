import mongoose, { Schema, Document, Model } from 'mongoose';
import { IMedicine } from './Medicine';

// =============================================================================
// Cart Interfaces
// =============================================================================

export interface ICartItem {
  medicine: mongoose.Types.ObjectId | IMedicine;
  quantity: number;
  addedAt: Date;
}

export interface ICart extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  itemCount: number;
}

// =============================================================================
// Cart Item Schema
// =============================================================================

const CartItemSchema = new Schema<ICartItem>(
  {
    medicine: {
      type: Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// =============================================================================
// Cart Schema
// =============================================================================

const CartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One cart per user
    },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// =============================================================================
// Indexes
// =============================================================================

CartSchema.index({ user: 1 });

// =============================================================================
// Virtuals
// =============================================================================

CartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// =============================================================================
// Instance Methods
// =============================================================================

CartSchema.methods.addItem = async function (
  medicineId: mongoose.Types.ObjectId,
  quantity: number = 1
) {
  const existingItemIndex = this.items.findIndex(
    (item: ICartItem) => item.medicine.toString() === medicineId.toString()
  );

  if (existingItemIndex > -1) {
    this.items[existingItemIndex].quantity += quantity;
  } else {
    this.items.push({
      medicine: medicineId,
      quantity,
      addedAt: new Date(),
    });
  }

  return this.save();
};

CartSchema.methods.removeItem = async function (medicineId: mongoose.Types.ObjectId) {
  this.items = this.items.filter(
    (item: ICartItem) => item.medicine.toString() !== medicineId.toString()
  );
  return this.save();
};

CartSchema.methods.updateItemQuantity = async function (
  medicineId: mongoose.Types.ObjectId,
  quantity: number
) {
  const item = this.items.find(
    (item: ICartItem) => item.medicine.toString() === medicineId.toString()
  );

  if (!item) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    return this.removeItem(medicineId);
  }

  item.quantity = quantity;
  return this.save();
};

CartSchema.methods.clear = async function () {
  this.items = [];
  return this.save();
};

// =============================================================================
// Static Methods
// =============================================================================

CartSchema.statics.getOrCreateCart = async function (userId: mongoose.Types.ObjectId) {
  let cart = await this.findOne({ user: userId }).populate({
    path: 'items.medicine',
    select: 'name price image stock isActive',
  });

  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }

  return cart;
};

// =============================================================================
// Export Model
// =============================================================================

const Cart: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);

export default Cart;
