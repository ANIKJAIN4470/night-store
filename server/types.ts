export interface IProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  mrp: number; // Maximum Retail Price
  sellingPrice: number; // Actual selling price (MRP + ₹10 typically)
  price?: number; // Deprecated - backward compatibility
  costPrice?: number; // Cost of goods - for profit calculations (NEW)
  stock: number; // Quantity in stock
  category: string;
  imageUrl: string;
  available: boolean;
  isSpecial?: boolean;
  isVeg?: boolean;
  brand?: string; // Product brand (Lays, Uncle Chipps, etc.)
  flavor?: string; // Flavor variant
  size?: string; // Package size
  weight?: string; // Net weight
  createdAt: string;
  updatedAt: string;
}

export interface IOrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  unitCost?: number;
  quantity: number;
  subtotal: number;
  imageUrl?: string;
}

export type DeliveryMethod = 'Room Delivery' | 'Self Pickup';

export type OrderStatus = 
  | 'Pending'           // Order placed, awaiting confirmation
  | 'Accepted'          // Order confirmed by admin
  | 'Preparing'         // Being prepared in kitchen
  | 'Out for Delivery'  // On the way to customer (delivery only)
  | 'Ready for Pickup'  // Ready at shop (pickup only)
  | 'Completed'         // Delivered or picked up successfully
  | 'Cancelled';        // Cancelled by customer or admin

export type PaymentMethod = 'Cash on Delivery' | 'UPI' | 'Online';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface IStatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string; // Admin username who made the change
}

export interface IOrder {
  id: string;
  orderNumber: string;
  trackingToken: string;
  customerId?: string;
  items: IOrderItem[];
  
  // Customer info
  customerName: string;
  customerPhone: string;
  
  // Delivery method (NEW)
  deliveryMethod: DeliveryMethod;
  
  // Address fields (enhanced)
  hostelName: string;
  hostelBlock?: string;
  roomNumber?: string; // Only for Room Delivery
  deliveryInstructions?: string; // Only for Room Delivery
  
  // Pricing
  subtotal: number;
  deliveryFee: number;
  discount: number;
  discountCode?: string;
  total: number;
  
  // Payment
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  
  // Status tracking (enhanced)
  orderStatus: OrderStatus;
  cancellationReason?: string;
  statusHistory: IStatusHistoryEntry[];
  
  // Timestamps for analytics (NEW)
  acceptedAt?: string;
  preparingStartedAt?: string;
  readyAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  
  // Additional
  idempotencyKey?: string;
  adminNotes?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface IAdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'staff';
  createdAt: string;
  updatedAt: string;
}

export interface ISettings {
  businessName: string;
  tagline: string;
  contactPhone: string;
  whatsappPhone: string;
  openingTime: string; // e.g. "17:00"
  closingTime: string; // e.g. "03:00"
  isOpen: boolean; // owner override
  deliveryFee: number;
  minOrderAmount: number;
  estimatedDeliveryTime: string; // e.g. "20-30 mins"
  acceptedHostels: string[];
  paymentMethods: {
    cod: boolean;
    upi: boolean;
  };
  upiQrUrl?: string;
  announcement?: string;
  updatedAt: string;
}
