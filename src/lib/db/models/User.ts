import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// =============================================================================
// User Interface
// =============================================================================

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'admin' | 'delivery';
  phone?: string;
  address?: IAddress;
  isActive: boolean;
  lastLocation?: {
    lat: number;
    lng: number;
    updatedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// =============================================================================
// Address Schema
// =============================================================================

const AddressSchema = new Schema<IAddress>(
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
// User Schema
// =============================================================================

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'delivery'],
      default: 'customer',
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Invalid phone number'],
    },
    address: AddressSchema,
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLocation: {
      lat: { type: Number },
      lng: { type: Number },
      updatedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// =============================================================================
// Indexes
// =============================================================================

UserSchema.index({ role: 1 });
UserSchema.index({ 'lastLocation.updatedAt': -1 });

// =============================================================================
// Pre-save Middleware - Hash Password
// =============================================================================

UserSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error: any) {
    throw error;
  }
});

// =============================================================================
// Instance Methods
// =============================================================================

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// =============================================================================
// JSON Transform
// =============================================================================

UserSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

// =============================================================================
// Export Model
// =============================================================================

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
