import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getOrderByNumber, getOrders } from '../db.js';
import {
  generateCustomerToken,
  requireCustomerAuth,
  checkAuthRateLimit,
  recordFailedAttempt,
  clearAuthFailures,
  AuthenticatedCustomerRequest,
  findCustomerByEmail,
  createCustomer,
} from '../customer-auth.js';
import { CustomerModel } from '../models/Customer.js';
import { OrderModel } from '../models/Order.js';
import { CouponModel } from '../models/Coupon.js';
import { RewardConfigModel } from '../models/Reward.js';

export const customerRouter = Router();

// CAPTCHA in-memory store: {challenge: {answer, expiresAt}}
const captchaStore = new Map<string, { answer: string; expiresAt: number }>();

function generateCaptcha(): { challenge: string; answer: string; display: string } {
  const num1 = Math.floor(Math.random() * 50) + 1;
  const num2 = Math.floor(Math.random() * 50) + 1;
  const answer = (num1 + num2).toString();
  const challenge = crypto.randomBytes(16).toString('hex');
  const display = `What is ${num1} + ${num2}?`;
  captchaStore.set(challenge, { answer, expiresAt: Date.now() + 5 * 60 * 1000 });
  setTimeout(() => captchaStore.delete(challenge), 5 * 60 * 1000);
  return { challenge, answer, display };
}

// 0. GET CAPTCHA CHALLENGE
customerRouter.get('/auth/captcha', (req: Request, res: Response) => {
  const { challenge, display } = generateCaptcha();
  res.json({ challenge, display });
});
customerRouter.post('/auth/register', async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const { name, email, phone, password, confirmPassword } = req.body;

  // Rate limit registration attempts
  const rateCheck = checkAuthRateLimit(ip, 'register');
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: `Too many registration attempts. Please try again in ${rateCheck.waitSeconds} seconds.`,
    });
    return;
  }

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    return;
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'Valid email address is required.' });
    return;
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 10) {
    res.status(400).json({ error: 'Valid phone number is required.' });
    return;
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters.' });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: 'Passwords do not match.' });
    return;
  }

  try {
    // Check if email already exists
    const existing = await findCustomerByEmail(email);
    if (existing) {
      recordFailedAttempt(ip, 'register');
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create customer
    const customer = await createCustomer(name.trim(), email, phone.trim(), passwordHash);

    clearAuthFailures(ip, 'register');

    // Generate token
    const token = generateCustomerToken({
      id: customer._id.toString(),
      email: customer.email,
      name: customer.name,
    });

    // Set cookie
    res.cookie('papis_customer_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      token,
      customer: {
        id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    recordFailedAttempt(ip, 'register');
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// 2. CUSTOMER LOGIN
customerRouter.post('/auth/login', async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const { email, password, captchaChallenge, captchaAnswer } = req.body;

  // Rate limit
  const rateCheck = checkAuthRateLimit(ip, 'login');
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: `Too many login attempts. Please try again in ${rateCheck.waitSeconds} seconds.`,
    });
    return;
  }

  // Verify CAPTCHA
  if (!captchaChallenge || !captchaAnswer) {
    res.status(400).json({ error: 'CAPTCHA verification required.' });
    return;
  }

  const captcha = captchaStore.get(captchaChallenge);
  if (!captcha || captcha.expiresAt < Date.now()) {
    res.status(400).json({ error: 'CAPTCHA expired. Please request a new one.' });
    captchaStore.delete(captchaChallenge);
    return;
  }

  if (captcha.answer !== captchaAnswer.toString()) {
    recordFailedAttempt(ip, 'login');
    captchaStore.delete(captchaChallenge);
    res.status(400).json({ error: 'CAPTCHA answer incorrect.' });
    return;
  }

  captchaStore.delete(captchaChallenge);

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const customer = await findCustomerByEmail(email);
    if (!customer) {
      recordFailedAttempt(ip, 'login');
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, customer.passwordHash);
    if (!isMatch) {
      recordFailedAttempt(ip, 'login');
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    clearAuthFailures(ip, 'login');

    // Associate any past guest orders with this customer by matching email/phone
    try {
      const customerId = customer._id.toString();
      await OrderModel.updateMany(
        { 
          customerId: { $exists: false },
          $or: [
            { customerPhone: customer.phone },
            { customerName: { $regex: customer.name, $options: 'i' } }
          ]
        },
        { $set: { customerId } }
      );
    } catch (orderLinkErr) {
      console.log('Failed to link past orders (non-critical):', orderLinkErr);
    }

    const token = generateCustomerToken({
      id: customer._id.toString(),
      email: customer.email,
      name: customer.name,
    });

    res.cookie('papis_customer_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      customer: {
        id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// 3. CUSTOMER LOGOUT
customerRouter.post('/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('papis_customer_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 4. GET CURRENT CUSTOMER
customerRouter.get('/auth/me', requireCustomerAuth, async (req: AuthenticatedCustomerRequest, res: Response) => {
  try {
    const customer = await CustomerModel.findById(req.customer?.id).select('-passwordHash');
    if (!customer) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    res.json({
      customer: {
        id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        isEmailVerified: customer.isEmailVerified,
        createdAt: customer.createdAt.toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve customer info.' });
  }
});

// 5. UPDATE CUSTOMER PROFILE
customerRouter.put('/profile', requireCustomerAuth, async (req: AuthenticatedCustomerRequest, res: Response) => {
  try {
    const { name, phone } = req.body;

    const updates: any = {};
    if (name && typeof name === 'string' && name.trim().length > 0) {
      updates.name = name.trim();
    }
    if (phone && typeof phone === 'string' && phone.trim().length > 0) {
      updates.phone = phone.trim();
    }

    const customer = await CustomerModel.findByIdAndUpdate(req.customer?.id, updates, { new: true }).select(
      '-passwordHash'
    );

    if (!customer) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    res.json({
      success: true,
      customer: {
        id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// 6. CHANGE PASSWORD
customerRouter.post('/change-password', requireCustomerAuth, async (req: AuthenticatedCustomerRequest, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new passwords are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'New passwords do not match.' });
      return;
    }

    const customer = await CustomerModel.findById(req.customer?.id);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, customer.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    customer.passwordHash = newHash;
    await customer.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// 7. GET CUSTOMER ORDERS
customerRouter.get('/orders', requireCustomerAuth, async (req: AuthenticatedCustomerRequest, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const status = req.query.status as string | undefined;

    const skip = (page - 1) * limit;

    const filter: any = { customerId: req.customer?.id };
    if (status && status !== 'All') {
      filter.orderStatus = status;
    }

    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await OrderModel.countDocuments(filter);

    const formattedOrders = orders.map((o: any) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      trackingToken: o.trackingToken,
      items: o.items,
      subtotal: o.subtotal,
      deliveryFee: o.deliveryFee,
      discount: o.discount || 0,
      total: o.total,
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt.toISOString(),
    }));

    res.json({
      orders: formattedOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

// 8. GET SINGLE ORDER
customerRouter.get('/orders/:id', requireCustomerAuth, async (req: AuthenticatedCustomerRequest, res: Response) => {
  try {
    const order = await OrderModel.findById(req.params.id);

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    // Verify ownership
    if (order.customerId?.toString() !== req.customer?.id) {
      res.status(403).json({ error: 'Unauthorized access to this order.' });
      return;
    }

    res.json({
      order: {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        items: order.items,
        customerName: order.customerName,
        hostelName: order.hostelName,
        hostelBlock: order.hostelBlock,
        roomNumber: order.roomNumber,
        deliveryInstructions: order.deliveryInstructions,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        statusHistory: order.statusHistory,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Failed to retrieve order.' });
  }
});

// 9. APPLY COUPON - VALIDATE AND RETURN DISCOUNT
customerRouter.post('/validate-coupon', async (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code) {
    res.status(400).json({ error: 'Coupon code required.' });
    return;
  }
  try {
    const coupon = await CouponModel.findOne({ code: code.toUpperCase(), isEnabled: true });
    if (!coupon) {
      res.status(404).json({ error: 'Invalid or expired coupon code.' });
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
    if (subtotal < coupon.minOrderAmount) {
      res.status(400).json({ error: `Minimum order amount ₹${coupon.minOrderAmount} required.` });
      return;
    }
    const discount = coupon.discountType === 'percentage' 
      ? Math.round((subtotal * coupon.discountValue) / 100) 
      : coupon.discountValue;
    res.json({ success: true, discount, code: coupon.code });
  } catch (err) {
    res.status(500).json({ error: 'Coupon validation failed.' });
  }
});

// 10. GET AVAILABLE COUPONS FOR CUSTOMER
customerRouter.get('/coupons', (req: Request, res: Response) => {
  CouponModel.find({ isEnabled: true, expiresAt: { $gt: new Date() } })
    .select('code discountType discountValue minOrderAmount')
    .then(coupons => res.json({ coupons }))
    .catch(() => res.status(500).json({ error: 'Failed to fetch coupons.' }));
});

// 11. GET CUSTOMER REWARDS STATUS
customerRouter.get('/rewards', requireCustomerAuth, async (req: AuthenticatedCustomerRequest, res: Response) => {
  try {
    const customer = await CustomerModel.findById(req.customer?.id);
    const config = await RewardConfigModel.findOne();
    if (!customer) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }
    const milestones = config?.milestones || [];
    const nextMilestone = milestones.find((m: any) => m.pointsRequired > customer.rewardPoints);
    res.json({
      points: customer.rewardPoints,
      transactions: customer.rewardTransactions,
      nextMilestone: nextMilestone ? { 
        pointsRequired: nextMilestone.pointsRequired, 
        pointsNeeded: nextMilestone.pointsRequired - customer.rewardPoints,
        reward: nextMilestone.rewardDescription 
      } : null,
      allMilestones: milestones
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rewards.' });
  }
});

// 12. REDEEM REWARD (requires authentication)
customerRouter.post('/redeem-reward', requireCustomerAuth, async (req: AuthenticatedCustomerRequest, res: Response) => {
  const { pointsToRedeem, milestoneIndex } = req.body;
  try {
    const customer = await CustomerModel.findById(req.customer?.id);
    const config = await RewardConfigModel.findOne();
    if (!customer || !config) {
      res.status(404).json({ error: 'Customer or reward config not found.' });
      return;
    }
    if (customer.rewardPoints < pointsToRedeem) {
      res.status(400).json({ error: 'Insufficient reward points.' });
      return;
    }
    const milestone = config.milestones[milestoneIndex];
    if (!milestone || milestone.pointsRequired > customer.rewardPoints) {
      res.status(400).json({ error: 'Invalid reward milestone.' });
      return;
    }
    customer.rewardPoints -= milestone.pointsRequired;
    customer.rewardTransactions.push({ type: 'redeem', amount: milestone.pointsRequired, date: new Date() });
    await customer.save();
    const couponCode = `REWARD${Date.now()}`;
    await CouponModel.create({ 
      code: couponCode, 
      discountType: 'fixed', 
      discountValue: milestone.rewardValue,
      isEnabled: true
    });
    res.json({ success: true, message: `Reward redeemed! Use code ${couponCode}`, couponCode, reward: milestone.rewardValue });
  } catch (err) {
    res.status(500).json({ error: 'Redemption failed.' });
  }
});
