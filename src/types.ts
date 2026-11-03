export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  mrp: number;
  sellingPrice: number;
  costPrice?: number;
  stock: number;
  price?: number; // Deprecated - kept for backward compatibility
  category: string;
  imageUrl: string;
  available: boolean;
  isSpecial?: boolean;
  isVeg?: boolean;
  brand?: string;
  flavor?: string;
  size?: string;
  weight?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type DeliveryMethod = 'Room Delivery' | 'Self Pickup';
export type OrderStatus = 'Pending' | 'Accepted' | 'Preparing' | 'Out for Delivery' | 'Ready for Pickup' | 'Completed' | 'Cancelled';
export type PaymentMethod = 'Cash on Delivery' | 'UPI' | 'Online';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  unitPrice: number;
  unitCost?: number;
  quantity: number;
  subtotal: number;
  imageUrl?: string;
}

export interface StatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id?: string;
  orderNumber: string;
  trackingToken?: string;
  customerId?: string;
  items: OrderItemSnapshot[];
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  hostelName: string;
  hostelBlock?: string;
  roomNumber?: string;
  deliveryInstructions?: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  discountCode?: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  orderStatus: OrderStatus;
  cancellationReason?: string;
  statusHistory: StatusHistoryItem[];
  acceptedAt?: string;
  preparingStartedAt?: string;
  readyAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  idempotencyKey?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  contactPhone: string;
  whatsappPhone: string;
  openingTime: string;
  closingTime: string;
  isOpen: boolean;
  deliveryFee: number;
  minOrderAmount: number;
  estimatedDeliveryTime: string;
  acceptedHostels: string[];
  paymentMethods: {
    cod: boolean;
    upi: boolean;
  };
  upiQrUrl?: string;
  announcement?: string;
  updatedAt?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  role: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  isEmailVerified?: boolean;
  createdAt?: string;
}
