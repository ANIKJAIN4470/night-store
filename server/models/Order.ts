import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItemDoc {
  productId: string;
  productName: string;
  unitPrice: number;
  unitCost?: number;
  quantity: number;
  subtotal: number;
  imageUrl?: string;
}

export interface IStatusHistoryDoc {
  status: string;
  timestamp: Date;
  note?: string;
  updatedBy?: string; // Admin username who made the status change
}

// Enhanced delivery method type
export type DeliveryMethod = 'Room Delivery' | 'Self Pickup';

// Enhanced order status type
export type OrderStatus = 
  | 'Pending'           // Order placed, awaiting confirmation
  | 'Accepted'          // Order confirmed by admin
  | 'Preparing'         // Being prepared in kitchen
  | 'Out for Delivery'  // On the way to customer (delivery only)
  | 'Ready for Pickup'  // Ready at shop (pickup only)
  | 'Completed'         // Delivered or picked up successfully
  | 'Cancelled';        // Cancelled by customer or admin

export interface IOrderDoc extends Document {
  orderNumber: string;
  trackingToken: string;
  customerId?: string; // Optional: for authenticated customers
  items: IOrderItemDoc[];
  
  // Customer info
  customerName: string;
  customerPhone: string;
  
  // Delivery method (NEW)
  deliveryMethod: DeliveryMethod; // 'Room Delivery' or 'Self Pickup'
  
  // Address fields (enhanced)
  hostelName: string;
  hostelBlock?: string;
  roomNumber?: string; // Only for Room Delivery
  deliveryInstructions?: string; // Only for Room Delivery
  
  // Pricing
  subtotal: number;
  deliveryFee: number; // 0 for Self Pickup
  discount: number;
  total: number;
  
  // Payment
  paymentMethod: 'Cash on Delivery' | 'UPI';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  paymentReference?: string;
  
  // Status tracking (enhanced)
  orderStatus: OrderStatus;
  cancellationReason?: string;
  statusHistory: IStatusHistoryDoc[];
  
  // Timestamps for analytics
  acceptedAt?: Date;     // When order was accepted
  preparingStartedAt?: Date; // When kitchen started preparing
  readyAt?: Date;        // When order ready (pickup) or out for delivery
  completedAt?: Date;    // When order completed
  cancelledAt?: Date;    // When order cancelled
  
  // Additional fields
  idempotencyKey?: string;
  adminNotes?: string;   // Internal admin notes
  
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItemDoc>(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    unitCost: { type: Number, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
    imageUrl: { type: String },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema<IStatusHistoryDoc>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
    updatedBy: { type: String }, // Admin username
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDoc>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    trackingToken: { type: String, required: true, index: true },
    customerId: { type: String, index: true, sparse: true },
    items: [OrderItemSchema],
    
    // Customer info
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    
    // Delivery method (NEW)
    deliveryMethod: {
      type: String,
      enum: ['Room Delivery', 'Self Pickup'],
      required: true,
      default: 'Room Delivery',
      index: true,
    },
    
    // Address fields (enhanced)
    hostelName: { type: String, required: true, trim: true, index: true },
    hostelBlock: { type: String, trim: true, sparse: true },
    roomNumber: { type: String, trim: true, sparse: true }, // Only for Room Delivery
    deliveryInstructions: { type: String, trim: true },
    
    // Pricing
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    
    // Payment
    paymentMethod: { type: String, enum: ['Cash on Delivery', 'UPI'], default: 'Cash on Delivery' },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
    paymentReference: { type: String, trim: true },
    
    // Status tracking (enhanced)
    orderStatus: {
      type: String,
      enum: ['Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Ready for Pickup', 'Completed', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    cancellationReason: { type: String },
    statusHistory: [StatusHistorySchema],
    
    // Timestamps for analytics (NEW)
    acceptedAt: { type: Date, sparse: true },
    preparingStartedAt: { type: Date, sparse: true },
    readyAt: { type: Date, sparse: true },
    completedAt: { type: Date, sparse: true },
    cancelledAt: { type: Date, sparse: true },
    
    // Additional fields
    idempotencyKey: { type: String, index: true, sparse: true },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

export const OrderModel = mongoose.models.Order || mongoose.model<IOrderDoc>('Order', OrderSchema);
