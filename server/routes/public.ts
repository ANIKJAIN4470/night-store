import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  getProducts,
  getProductById,
  getSettings,
  createOrder,
  getOrderByNumber,
  cancelOrder,
  getDatabaseStatus,
} from '../db.js';
import { IOrderItem, PaymentMethod } from '../types.js';
import { CouponModel } from '../models/Coupon.js';

export const publicRouter = Router();

// Cache for idempotency keys to avoid duplicate order requests within 60 seconds
const seenIdempotencyKeys = new Map<string, any>();

// 1. Health check
publicRouter.get('/health', async (req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    status: 'ok',
    service: "Papi's Kitchen API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// 2. Public products list
publicRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const availableOnly = req.query.availableOnly === 'true';

    const products = await getProducts({ category, search, availableOnly });
    res.json({ products });
  } catch (err: any) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// 3. Single product details
publicRouter.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve product' });
  }
});

// 4. Public settings
publicRouter.get('/settings/public', async (req: Request, res: Response) => {
  try {
    const settings = await getSettings();
    // Exclude internal database configs if any
    res.json({
      settings: {
        businessName: settings.businessName,
        tagline: settings.tagline,
        contactPhone: settings.contactPhone,
        whatsappPhone: settings.whatsappPhone,
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
        isOpen: settings.isOpen,
        deliveryFee: settings.deliveryFee,
        minOrderAmount: settings.minOrderAmount,
        estimatedDeliveryTime: settings.estimatedDeliveryTime,
        acceptedHostels: settings.acceptedHostels,
        paymentMethods: { cod: true, upi: true },
        upiQrUrl: '/upi-qr.jpe',
        announcement: settings.announcement,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve business settings' });
  }
});

// Helper to validate Indian phone number: 10 digits
function isValidIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  // Allows 10 digits or 91 followed by 10 digits or 0 followed by 10 digits
  return /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(cleaned);
}

// 5. Place an order (Guest checkout)
publicRouter.post('/orders', async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerPhone,
      deliveryMethod,
      hostelName,
      hostelBlock,
      roomNumber,
      deliveryInstructions,
      items,
      paymentMethod,
      idempotencyKey,
      couponCode,
    } = req.body;

    // Check duplicate submission
    if (idempotencyKey && seenIdempotencyKeys.has(idempotencyKey)) {
      const cached = seenIdempotencyKeys.get(idempotencyKey);
      res.status(200).json(cached);
      return;
    }

    // Validation
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      res.status(400).json({ error: 'Please enter a valid student name (at least 2 letters).' });
      return;
    }

    if (!customerPhone || !isValidIndianPhone(customerPhone)) {
      res.status(400).json({
        error: 'Please enter a valid 10-digit Indian mobile number for delivery communication.',
      });
      return;
    }

    // Validate delivery method
    const validDeliveryMethods = ['Room Delivery', 'Self Pickup'];
    if (!deliveryMethod || !validDeliveryMethods.includes(deliveryMethod)) {
      res.status(400).json({ error: 'Please select a delivery method.' });
      return;
    }

    // For Room Delivery, validate address fields
    if (deliveryMethod === 'Room Delivery') {
      if (!hostelName || typeof hostelName !== 'string' || hostelName.trim() === '') {
        res.status(400).json({ error: 'Please select or enter your hostel name.' });
        return;
      }

      if (!roomNumber || typeof roomNumber !== 'string' || roomNumber.trim() === '') {
        res.status(400).json({ error: 'Please enter your room number for room delivery.' });
        return;
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Your cart is empty. Please add snacks before ordering.' });
      return;
    }

    // Business settings check
    const settings = await getSettings();
    if (!settings.isOpen) {
      res.status(400).json({
        error:
          'Papi\'s Kitchen is currently not accepting orders. Please check opening hours or the announcement banner.',
      });
      return;
    }

    // Validate payment method
    const validMethods: PaymentMethod[] = ['Cash on Delivery', 'UPI'];
    if (paymentMethod && !validMethods.includes(paymentMethod)) {
      res.status(400).json({ error: 'Invalid payment method.' });
      return;
    }
    const chosenPayment: PaymentMethod = paymentMethod || 'Cash on Delivery';

    // REVALIDATE PRODUCTS & PRICES with backend database
    let calculatedSubtotal = 0;
    const validatedOrderItems: IOrderItem[] = [];

    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity < 1) {
        res.status(400).json({ error: 'Invalid product quantity detected in cart.' });
        return;
      }

      const dbProduct = await getProductById(item.productId);
      if (!dbProduct) {
        res.status(400).json({
          error: `Product "${item.productName || item.productId}" is no longer available on the menu.`,
        });
        return;
      }

      if (!dbProduct.available) {
        res.status(400).json({
          error: `Sorry, "${dbProduct.name}" is currently sold out. Please remove it from your cart.`,
        });
        return;
      }

      const itemQty = Math.floor(item.quantity);
      if (itemQty > dbProduct.stock) {
        res.status(400).json({ error: `Only ${dbProduct.stock} unit(s) of "${dbProduct.name}" are available.` });
        return;
      }
      const itemSubtotal = (dbProduct.sellingPrice || dbProduct.price || 0) * itemQty;
      calculatedSubtotal += itemSubtotal;

      // Save immutable snapshot
      validatedOrderItems.push({
        productId: dbProduct.id,
        productName: dbProduct.name,
        unitPrice: dbProduct.sellingPrice || dbProduct.price || 0,
        unitCost: dbProduct.costPrice || 0,
        quantity: itemQty,
        subtotal: itemSubtotal,
        imageUrl: dbProduct.imageUrl,
      });
    }

    // Check minimum order
    if (calculatedSubtotal < (settings.minOrderAmount || 0)) {
      res.status(400).json({
        error: `Minimum order amount is ₹${settings.minOrderAmount}. Current snack subtotal is ₹${calculatedSubtotal}.`,
      });
      return;
    }

    const deliveryFee = deliveryMethod === 'Room Delivery' ? (settings.deliveryFee || 0) : 0;
    let discount = 0;

    // Validate and apply coupon if provided
    if (couponCode) {
      const coupon = await CouponModel.findOne({ code: couponCode.toUpperCase(), isEnabled: true });
      if (!coupon) {
        res.status(400).json({ error: 'Invalid or expired coupon code.' });
        return;
      }
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        res.status(400).json({ error: 'Coupon has expired.' });
        return;
      }
      if (coupon.maxUsageCount && coupon.usedCount >= coupon.maxUsageCount) {
        res.status(400).json({ error: 'Coupon usage limit exceeded.' });
        return;
      }
      if (calculatedSubtotal < coupon.minOrderAmount) {
        res.status(400).json({ error: `Minimum order amount ₹${coupon.minOrderAmount} required for this coupon.` });
        return;
      }
      discount = coupon.discountType === 'percentage'
        ? Math.round((calculatedSubtotal * coupon.discountValue) / 100)
        : coupon.discountValue;

      // Increment coupon usage
      coupon.usedCount = (coupon.usedCount || 0) + 1;
      await coupon.save();
    }

    const finalTotal = calculatedSubtotal + deliveryFee - discount;

    // Generate unique unguessable public order number and tracking token
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
    const orderNumber = `PK-${randomHex}`;
    const trackingToken = crypto.randomBytes(16).toString('hex'); // 32 hex chars

    const newOrder = await createOrder({
      orderNumber,
      trackingToken,
      customerId: req.body.customerId || undefined,
      items: validatedOrderItems,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryMethod,
      hostelName: deliveryMethod === 'Room Delivery' ? hostelName.trim() : 'Self Pickup',
      hostelBlock: deliveryMethod === 'Room Delivery' ? (hostelBlock || '').trim() : undefined,
      roomNumber: deliveryMethod === 'Room Delivery' ? roomNumber.trim() : undefined,
      deliveryInstructions: deliveryMethod === 'Room Delivery' ? (deliveryInstructions ? deliveryInstructions.trim() : undefined) : undefined,
      subtotal: calculatedSubtotal,
      deliveryFee,
      discount,
      total: finalTotal,
      paymentMethod: chosenPayment,
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      statusHistory: [
        {
          status: 'Pending',
          timestamp: new Date().toISOString(),
          note: 'Order successfully placed by student',
        },
      ],
      idempotencyKey,
    });

    const responsePayload = {
      success: true,
      orderNumber: newOrder.orderNumber,
      trackingToken: newOrder.trackingToken,
      customerName: newOrder.customerName,
      deliveryMethod: newOrder.deliveryMethod,
      hostelName: newOrder.hostelName,
      roomNumber: newOrder.roomNumber,
      total: newOrder.total,
      subtotal: newOrder.subtotal,
      deliveryFee: newOrder.deliveryFee,
      discount: discount,
      items: newOrder.items,
      paymentMethod: newOrder.paymentMethod,
      orderStatus: newOrder.orderStatus,
      createdAt: newOrder.createdAt,
      estimatedDeliveryTime: settings.estimatedDeliveryTime,
    };

    // Award reward points if customer authenticated
    if (req.body.customerId) {
      try {
        const { CustomerModel } = await import('../models/Customer.js');
        const customer = await CustomerModel.findById(req.body.customerId);
        if (customer) {
          const pointsEarned = Math.floor(newOrder.subtotal * 0.1); // 1 point per ₹10
          customer.rewardPoints = (customer.rewardPoints || 0) + pointsEarned;
          customer.rewardTransactions.push({ 
            type: 'earn', 
            amount: pointsEarned, 
            orderId: newOrder.orderNumber,
            date: new Date()
          });
          await customer.save();
        }
      } catch (err) {
        console.log('Reward points not awarded (non-critical)');
      }
    }

    if (idempotencyKey) {
      seenIdempotencyKeys.set(idempotencyKey, responsePayload);
      setTimeout(() => seenIdempotencyKeys.delete(idempotencyKey), 60000);
    }

    res.status(201).json(responsePayload);
  } catch (err: any) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to place order. Please try again.' });
  }
});

// 6. Public Order Tracking (Requires token)
publicRouter.get('/orders/:orderNumber', async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const token = (req.query.token as string) || (req.headers['x-tracking-token'] as string);

    if (!token) {
      res.status(401).json({
        error: 'Tracking authorization token required to view order status.',
      });
      return;
    }

    const order = await getOrderByNumber(orderNumber);
    if (!order) {
      res.status(404).json({ error: 'Order not found with the provided order number.' });
      return;
    }

    // Verify token matches
    if (order.trackingToken !== token) {
      res.status(403).json({ error: 'Invalid tracking token for this order.' });
      return;
    }

    // Return safe customer view (mask full customer phone, avoid leaking admin notes)
    const maskedPhone = order.customerPhone.replace(/(\d{2})\d{4}(\d{4})/, '$1****$2');

    res.json({
      order: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: maskedPhone,
        deliveryMethod: order.deliveryMethod,
        hostelName: order.hostelName,
        hostelBlock: order.hostelBlock,
        roomNumber: order.roomNumber,
        deliveryInstructions: order.deliveryInstructions,
        items: order.items,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        statusHistory: order.statusHistory,
        cancellationReason: order.cancellationReason,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (err: any) {
    console.error('Error tracking order:', err);
    res.status(500).json({ error: 'Failed to retrieve order tracking info' });
  }
});

// 7. Customer order cancellation
publicRouter.post('/orders/:orderNumber/cancel', async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const { token, reason } = req.body;

    if (!token) {
      res.status(401).json({ error: 'Tracking token required to cancel order.' });
      return;
    }

    const order = await getOrderByNumber(orderNumber);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    if (order.trackingToken !== token) {
      res.status(403).json({ error: 'Invalid tracking authorization.' });
      return;
    }

    const cancelResult = await cancelOrder(
      order.id,
      reason || 'Cancelled by customer before preparation',
      true
    );

    if (!cancelResult.success) {
      res.status(400).json({ error: cancelResult.message });
      return;
    }

    res.json({
      success: true,
      message: 'Your order has been cancelled successfully.',
      order: cancelResult.order,
    });
  } catch (err: any) {
    console.error('Error cancelling order:', err);
    res.status(500).json({ error: 'Failed to cancel order.' });
  }
});
