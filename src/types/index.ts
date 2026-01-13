// =============================================================================
// Medishop Core Types
// =============================================================================

// User Roles
export type UserRole = 'customer' | 'admin' | 'delivery';

// User
export interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  address?: Address;
  createdAt: Date;
  updatedAt: Date;
}

// Address
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Medicine
export interface Medicine {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  manufacturer: string;
  requiresPrescription: boolean; // Always false for OTC
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Cart Item
export interface CartItem {
  medicine: Medicine;
  quantity: number;
}

// Order Status
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

// Payment Status
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// Order
export interface Order {
  _id: string;
  orderNumber: string;
  customer: User;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  deliveryMan?: User;
  deliveryAddress: Address;
  deliveryLocation?: {
    lat: number;
    lng: number;
    updatedAt: Date;
  };
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order Item
export interface OrderItem {
  medicine: Medicine;
  quantity: number;
  priceAtTime: number;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
