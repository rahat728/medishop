import mongoose, { Schema, Document, Model } from 'mongoose';

// =============================================================================
// Medicine Interface
// =============================================================================

export interface IMedicine extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number; // For showing discounts
  category: string;
  stock: number;
  lowStockThreshold: number;
  image?: string;
  images?: string[];
  manufacturer: string;
  activeIngredients?: string[];
  dosage?: string;
  warnings?: string[];
  directions?: string;
  requiresPrescription: boolean; // Always false for OTC
  isActive: boolean;
  isFeatured: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  isLowStock: boolean;
  isOutOfStock: boolean;
  discountPercentage: number;
}

// =============================================================================
// Medicine Schema
// =============================================================================

const MedicineSchema = new Schema<IMedicine>(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    compareAtPrice: {
      type: Number,
      min: [0, 'Compare at price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Pain Relief',
        'Cold & Flu',
        'Digestive Health',
        'Allergy',
        'First Aid',
        'Vitamins & Supplements',
        'Skin Care',
        'Eye Care',
        'Oral Care',
        'Other',
      ],
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Threshold cannot be negative'],
    },
    image: {
      type: String,
      default: '/images/placeholder-medicine.png',
    },
    images: [String],
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
    },
    activeIngredients: [String],
    dosage: String,
    warnings: [String],
    directions: String,
    requiresPrescription: {
      type: Boolean,
      default: false, // Always false for OTC medicines
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    tags: [String],
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

MedicineSchema.index({ name: 'text', description: 'text', tags: 'text' });
MedicineSchema.index({ slug: 1 });
MedicineSchema.index({ category: 1 });
MedicineSchema.index({ price: 1 });
MedicineSchema.index({ isActive: 1, isFeatured: 1 });
MedicineSchema.index({ stock: 1 });

// =============================================================================
// Virtuals
// =============================================================================

MedicineSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.lowStockThreshold && this.stock > 0;
});

MedicineSchema.virtual('isOutOfStock').get(function () {
  return this.stock === 0;
});

MedicineSchema.virtual('discountPercentage').get(function () {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) {
    return 0;
  }
  return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
});

// =============================================================================
// Pre-save Middleware - Generate Slug
// =============================================================================

MedicineSchema.pre('save', function () {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Add random suffix to ensure uniqueness
    if (this.isNew) {
      this.slug += '-' + Math.random().toString(36).substring(2, 8);
    }
  }
});

// =============================================================================
// Static Methods
// =============================================================================

MedicineSchema.statics.findByCategory = function (category: string) {
  return this.find({ category, isActive: true }).sort({ name: 1 });
};

MedicineSchema.statics.findFeatured = function (limit: number = 8) {
  return this.find({ isFeatured: true, isActive: true }).limit(limit);
};

MedicineSchema.statics.findLowStock = function () {
  return this.find({
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    stock: { $gt: 0 },
    isActive: true,
  });
};

MedicineSchema.statics.search = function (query: string) {
  return this.find(
    { $text: { $search: query }, isActive: true },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
};

// =============================================================================
// Export Model
// =============================================================================

const Medicine: Model<IMedicine> =
  mongoose.models.Medicine || mongoose.model<IMedicine>('Medicine', MedicineSchema);

export default Medicine;
