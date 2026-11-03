/**
 * Order Mapper - Converts MongoDB order documents to IOrder type
 * Handles field mapping and new delivery method fields
 */

import { IOrder } from './types.js';

/**
 * Convert MongoDB order document to IOrder interface
 * Handles legacy orders without deliveryMethod and new fields
 */
export function mapMongoOrderToIOrder(doc: any): IOrder {
  return {
    id: doc._id?.toString() || doc.id,
    orderNumber: doc.orderNumber,
    trackingToken: doc.trackingToken,
    customerId: doc.customerId,
    items: (doc.items || []).map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      unitCost: item.unitCost,
      quantity: item.quantity,
      subtotal: item.subtotal,
      imageUrl: item.imageUrl,
    })),
    
    // Customer info
    customerName: doc.customerName,
    customerPhone: doc.customerPhone,
    
    // Delivery method (default to Room Delivery for legacy orders)
    deliveryMethod: doc.deliveryMethod || 'Room Delivery',
    
    // Address fields
    hostelName: doc.hostelName,
    hostelBlock: doc.hostelBlock,
    roomNumber: doc.roomNumber, // May be undefined for pickup orders
    deliveryInstructions: doc.deliveryInstructions,
    
    // Pricing
    subtotal: doc.subtotal,
    deliveryFee: doc.deliveryFee || 0,
    discount: doc.discount || 0,
    discountCode: doc.discountCode,
    total: doc.total,
    
    // Payment
    paymentMethod: doc.paymentMethod,
    paymentStatus: doc.paymentStatus,
    paymentReference: doc.paymentReference,
    
    // Status tracking
    orderStatus: doc.orderStatus,
    cancellationReason: doc.cancellationReason,
    statusHistory: (doc.statusHistory || []).map((h: any) => ({
      status: h.status,
      timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
      note: h.note,
      updatedBy: h.updatedBy,
    })),
    
    // Timestamps for analytics
    acceptedAt: doc.acceptedAt ? new Date(doc.acceptedAt).toISOString() : undefined,
    preparingStartedAt: doc.preparingStartedAt ? new Date(doc.preparingStartedAt).toISOString() : undefined,
    readyAt: doc.readyAt ? new Date(doc.readyAt).toISOString() : undefined,
    completedAt: doc.completedAt ? new Date(doc.completedAt).toISOString() : undefined,
    cancelledAt: doc.cancelledAt ? new Date(doc.cancelledAt).toISOString() : undefined,
    
    // Additional
    idempotencyKey: doc.idempotencyKey,
    adminNotes: doc.adminNotes,
    
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
}

/**
 * Map local store order to IOrder
 */
export function mapLocalOrderToIOrder(order: any): IOrder {
  return {
    ...order,
    deliveryMethod: order.deliveryMethod || 'Room Delivery',
  };
}
