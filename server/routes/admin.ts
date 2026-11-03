import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import ExcelJS from 'exceljs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  findAdminByUsername,
  findAdminById,
  getDashboardStats,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderPayment,
  cancelOrder,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getSettings,
  updateSettings,
  getDatabaseStatus,
  getBusinessAnalytics,
} from '../db.js';
import {
  generateToken,
  requireAdminAuth,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginFailures,
  trackAdminSession,
  endAdminSession,
  AuthenticatedRequest,
} from '../auth.js';
import { createOTP, verifyOTP, generateDeviceFingerprint, isDeviceTrusted, trustDevice } from '../mfa.js';
import { OrderStatus, PaymentStatus, IProduct } from '../types.js';
import { extractProductsFromDocument } from '../services/ocr.js';
import { validateBulkImport } from '../services/productImport.js';

export const adminRouter = Router();

// 1. Admin Login - Step 1: Verify Credentials & Send OTP
adminRouter.post('/auth/login', async (req: Request, res: Response) => {
  const ip = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || '';
  const { username, password } = req.body;

  const rateCheck = checkLoginRateLimit(ip);
  if (!rateCheck.allowed) {
    console.warn(`🚫 Admin login blocked - rate limit exceeded for IP: ${ip}`);
    res.status(429).json({ error: `Too many attempts. Try again in ${rateCheck.waitSeconds}s.` });
    return;
  }

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  try {
    const admin = await findAdminByUsername(username);
    if (!admin) {
      recordFailedLogin(ip);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      recordFailedLogin(ip);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Password correct - now send OTP
    clearLoginFailures(ip);
    const adminId = admin.id || (admin as any)._id;
    const otp = createOTP(adminId);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ OTP generated for admin ${username}: ${otp}`);
    }

    res.json({
      success: true,
      requiresOTP: true,
      message: 'OTP sent. Check console/email for verification code.',
      otpExpiresIn: 600,
      adminId,
      ...(process.env.NODE_ENV === 'development' ? { developmentOtp: otp } : {}),
    });
  } catch (err: any) {
    console.error('❌ Admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 2. Admin Login - Step 2: Verify OTP & Create Session
adminRouter.post('/auth/verify-otp', async (req: Request, res: Response) => {
  const ip = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || '';
  const { adminId, otp, rememberDevice } = req.body;

  if (!adminId || !otp) {
    res.status(400).json({ error: 'Admin ID and OTP required' });
    return;
  }

  try {
    // Verify OTP
    if (!verifyOTP(adminId, otp)) {
      res.status(401).json({ error: 'Invalid or expired OTP' });
      return;
    }

    // Get admin details
    const admin = await findAdminById(adminId);
    if (!admin) {
      res.status(401).json({ error: 'Admin not found' });
      return;
    }

    // Generate device fingerprint
    const deviceFingerprint = generateDeviceFingerprint(userAgent, ip);

    // If user wants to trust this device
    if (rememberDevice) {
      trustDevice(adminId, deviceFingerprint);
      console.log(`✅ Device trusted for admin ${adminId}`);
    }

    // Create token and session
    const token = generateToken({
      id: admin.id || (admin as any)._id,
      username: admin.username,
      role: admin.role,
    });

    trackAdminSession(admin.id || (admin as any)._id, ip, userAgent);

    res.cookie('papis_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log(`🔓 Admin authenticated successfully: ${admin.username} from ${ip}`);

    res.json({
      success: true,
      token,
      user: {
        id: admin.id || (admin as any)._id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (err: any) {
    console.error('❌ OTP verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// 3. Admin Logout
adminRouter.post('/auth/logout', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.adminUser) {
    endAdminSession(req.adminUser.id);
  }
  res.clearCookie('papis_admin_token');
  console.log(`✅ Admin logged out: ${req.adminUser?.username}`);
  res.json({ success: true, message: 'Logged out' });
});

// 3. Current Admin Session
adminRouter.get('/auth/me', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    user: req.adminUser,
    database: getDatabaseStatus(),
  });
});

// 4. Dashboard Stats
adminRouter.get('/dashboard', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await getDashboardStats();
    const dbStatus = getDatabaseStatus();
    res.json({ stats, database: dbStatus });
  } catch (err: any) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard data' });
  }
});

// 5. Orders List
adminRouter.get('/orders', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;

    const data = await getOrders({ status, search, date, page, limit });
    res.json(data);
  } catch (err: any) {
    console.error('Admin get orders error:', err);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

// 6. Order Details
adminRouter.get('/orders/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json({ order });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// 7. Update Order Status
adminRouter.patch('/orders/:id/status', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, note } = req.body;
    const validStatuses: OrderStatus[] = [
      'Pending',
      'Accepted',
      'Preparing',
      'Out for Delivery',
      'Ready for Pickup',
      'Completed',
      'Cancelled',
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const order = await getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (status === 'Accepted' && order.paymentMethod === 'UPI' && order.paymentStatus !== 'Paid') {
      res.status(400).json({ error: 'Verify the UPI payment before accepting this order.' });
      return;
    }

    // Prevent transitions once Completed or Cancelled
    if (order.orderStatus === 'Completed' && status !== 'Completed') {
      res.status(400).json({ error: 'Cannot change status of an already Completed order' });
      return;
    }

    const updated = await updateOrderStatus(req.params.id, status, note || `Updated by admin (${req.adminUser?.username})`);
    if (!updated) {
      res.status(500).json({ error: 'Could not update status' });
      return;
    }

    res.json({ success: true, order: updated });
  } catch (err: any) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// 8. Update Order Payment
adminRouter.patch('/orders/:id/payment', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentStatus, reference } = req.body;
    const validStatuses: PaymentStatus[] = ['Pending', 'Paid', 'Failed', 'Refunded'];

    if (!validStatuses.includes(paymentStatus)) {
      res.status(400).json({ error: 'Invalid payment status' });
      return;
    }

    const updated = await updateOrderPayment(req.params.id, paymentStatus, reference);
    if (!updated) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ success: true, order: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// 9. Admin Cancel Order
adminRouter.post('/orders/:id/cancel', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim() === '') {
      res.status(400).json({ error: 'Cancellation reason is required' });
      return;
    }

    const result = await cancelOrder(req.params.id, reason, false);
    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json({ success: true, order: result.order });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// 10. Admin Product Management
adminRouter.get('/products', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const products = await getProducts();
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

adminRouter.post('/products', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, mrp, sellingPrice, costPrice, stock, category, imageUrl, available, isSpecial, isVeg, brand, flavor, size, weight } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Product name is required' });
      return;
    }

    if (typeof mrp !== 'number' || mrp < 0 || isNaN(mrp)) {
      res.status(400).json({ error: 'Valid positive MRP is required' });
      return;
    }

    if (typeof sellingPrice !== 'number' || sellingPrice < 0 || isNaN(sellingPrice)) {
      res.status(400).json({ error: 'Valid positive selling price is required' });
      return;
    }
    if (costPrice !== undefined && (typeof costPrice !== 'number' || costPrice < 0 || isNaN(costPrice))) {
      res.status(400).json({ error: 'Cost price must be a non-negative number' });
      return;
    }

    if (sellingPrice < mrp) {
      res.status(400).json({ error: 'Selling price must be >= MRP' });
      return;
    }

    if (typeof stock !== 'number' || stock < 0 || isNaN(stock)) {
      res.status(400).json({ error: 'Valid stock quantity is required' });
      return;
    }

    if (!category || typeof category !== 'string') {
      res.status(400).json({ error: 'Category is required' });
      return;
    }

    if (!imageUrl || typeof imageUrl !== 'string') {
      res.status(400).json({ error: 'Product image URL is required' });
      return;
    }

    // Check for duplicate: brand + flavor + mrp + size
    if (brand && flavor && size) {
      const existing = await getProducts();
      const duplicate = existing.find(p => 
        p.brand === brand && 
        p.flavor === flavor && 
        p.mrp === mrp && 
        p.size === size
      );
      if (duplicate) {
        res.status(409).json({ error: `Duplicate product already exists: ${brand} ${flavor} ${size} ₹${mrp}` });
        return;
      }
    }

    const newProd = await createProduct({
      name: name.trim(),
      description: (description || '').trim(),
      mrp,
      sellingPrice,
      costPrice: typeof costPrice === 'number' ? costPrice : 0,
      stock: Math.max(0, stock),
      category,
      imageUrl,
      available: available !== false,
      isSpecial: !!isSpecial,
      isVeg: isVeg !== false,
      brand: brand ? brand.trim() : undefined,
      flavor: flavor ? flavor.trim() : undefined,
      size: size ? size.trim() : undefined,
      weight: weight ? weight.trim() : undefined,
    });

    res.status(201).json({ success: true, product: newProd });
  } catch (err: any) {
    console.error('Create product error:', err);
    if (err.message && err.message.includes('duplicate')) {
      res.status(409).json({ error: 'Duplicate product detected' });
    } else {
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
});

adminRouter.put('/products/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, mrp, sellingPrice, costPrice, stock, category, imageUrl, available, isSpecial, isVeg, brand, flavor, size, weight } = req.body;

    const updates: any = {};
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ error: 'Product name cannot be empty' });
        return;
      }
      updates.name = name.trim();
    }
    
    if (mrp !== undefined) {
      if (typeof mrp !== 'number' || mrp < 0 || isNaN(mrp)) {
        res.status(400).json({ error: 'Valid MRP is required' });
        return;
      }
      updates.mrp = mrp;
    }
    
    if (sellingPrice !== undefined) {
      if (typeof sellingPrice !== 'number' || sellingPrice < 0 || isNaN(sellingPrice)) {
        res.status(400).json({ error: 'Valid selling price is required' });
        return;
      }
      updates.sellingPrice = sellingPrice;
    }
    if (costPrice !== undefined) {
      if (typeof costPrice !== 'number' || costPrice < 0 || isNaN(costPrice)) {
        res.status(400).json({ error: 'Cost price must be a non-negative number' });
        return;
      }
      updates.costPrice = costPrice;
    }
    
    if (stock !== undefined) {
      if (typeof stock !== 'number' || stock < 0 || isNaN(stock)) {
        res.status(400).json({ error: 'Valid stock quantity is required' });
        return;
      }
      updates.stock = Math.max(0, stock);
    }
    
    if (description !== undefined) updates.description = description.trim();
    if (category !== undefined) updates.category = category;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (available !== undefined) updates.available = !!available;
    if (isSpecial !== undefined) updates.isSpecial = !!isSpecial;
    if (isVeg !== undefined) updates.isVeg = !!isVeg;
    if (brand !== undefined) updates.brand = brand ? brand.trim() : undefined;
    if (flavor !== undefined) updates.flavor = flavor ? flavor.trim() : undefined;
    if (size !== undefined) updates.size = size ? size.trim() : undefined;
    if (weight !== undefined) updates.weight = weight ? weight.trim() : undefined;

    const updated = await updateProduct(req.params.id, updates);
    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ success: true, product: updated });
  } catch (err: any) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

adminRouter.delete('/products/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ok = await deleteProduct(req.params.id);
    if (!ok) {
      res.status(404).json({ error: 'Product not found or could not be deleted' });
      return;
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// 11. Admin Business Settings
adminRouter.get('/settings', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await getSettings();
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

adminRouter.put('/settings', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      businessName,
      tagline,
      contactPhone,
      whatsappPhone,
      openingTime,
      closingTime,
      isOpen,
      deliveryFee,
      minOrderAmount,
      estimatedDeliveryTime,
      acceptedHostels,
      announcement,
    } = req.body;

    const updates: any = {};
    if (businessName) updates.businessName = businessName.trim();
    if (tagline) updates.tagline = tagline.trim();
    if (contactPhone) updates.contactPhone = contactPhone.trim();
    if (whatsappPhone) updates.whatsappPhone = whatsappPhone.trim();
    if (openingTime) updates.openingTime = openingTime;
    if (closingTime) updates.closingTime = closingTime;
    if (isOpen !== undefined) updates.isOpen = !!isOpen;
    if (typeof deliveryFee === 'number' && deliveryFee >= 0) updates.deliveryFee = deliveryFee;
    if (typeof minOrderAmount === 'number' && minOrderAmount >= 0) updates.minOrderAmount = minOrderAmount;
    if (estimatedDeliveryTime) updates.estimatedDeliveryTime = estimatedDeliveryTime;
    if (Array.isArray(acceptedHostels)) updates.acceptedHostels = acceptedHostels;
    if (announcement !== undefined) updates.announcement = announcement;

    const updated = await updateSettings(updates);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update business settings' });
  }
});

// 12. Business Analytics & Reports
adminRouter.get('/analytics', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    const analytics = await getBusinessAnalytics({ startDate, endDate });
    res.json(analytics);
  } catch (err: any) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics data' });
  }
});

// 13. Generate Excel Report
adminRouter.get('/reports/excel', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    const analytics = await getBusinessAnalytics({ startDate, endDate });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Business Report');

    // Summary section
    worksheet.addRow(['Business Report']);
    worksheet.addRow([`Generated: ${new Date().toLocaleString()}`]);
    worksheet.addRow([]);

    worksheet.addRow(['Summary Metrics']);
    worksheet.addRow(['Total Orders', analytics.summary.totalOrders]);
    worksheet.addRow(['Active Orders', analytics.summary.activeOrders]);
    worksheet.addRow(['Cancelled Orders', analytics.summary.cancelledOrders]);
    worksheet.addRow(['Completed Orders', analytics.summary.completedOrders]);
    worksheet.addRow(['Total Units Sold', analytics.summary.totalUnitsSold]);
    worksheet.addRow(['Total Revenue', analytics.summary.totalRevenue]);
    worksheet.addRow(['Collected Revenue', analytics.summary.collectedRevenue]);
    worksheet.addRow(['Total COGS', analytics.summary.totalCOGS]);
    worksheet.addRow(['Gross Profit', analytics.summary.grossProfit]);
    worksheet.addRow(['Net Profit', analytics.summary.netProfit]);
    worksheet.addRow(['Profit Margin', `${analytics.summary.profitMargin}%`]);
    worksheet.addRow([]);

    // Product-wise sales
    worksheet.addRow(['Product Sales']);
    worksheet.addRow(['Product Name', 'Category', 'Brand', 'Units Sold', 'Revenue', 'COGS', 'Gross Profit', 'Orders']);
    analytics.productAnalytics.productProfitability.forEach((p) => {
      worksheet.addRow([
        p.productName,
        p.category,
        p.brand || '',
        p.unitsSold,
        p.revenue,
        p.cogs,
        p.grossProfit,
        p.orders,
      ]);
    });
    worksheet.addRow([]);

    // Delivery vs Pickup
    worksheet.addRow(['Delivery Analytics']);
    worksheet.addRow(['Delivery Orders', analytics.deliveryAnalytics.deliveryOrders]);
    worksheet.addRow(['Pickup Orders', analytics.deliveryAnalytics.pickupOrders]);
    worksheet.addRow(['Delivery Revenue', analytics.deliveryAnalytics.deliveryRevenue]);
    worksheet.addRow(['Pickup Revenue', analytics.deliveryAnalytics.pickupRevenue]);
    worksheet.addRow([]);

    // Status distribution
    worksheet.addRow(['Order Status Distribution']);
    Object.entries(analytics.statusDistribution).forEach(([status, count]) => {
      worksheet.addRow([status, count]);
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=business-report-${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    console.error('Excel generation error:', err);
    res.status(500).json({ error: 'Failed to generate Excel report' });
  }
});

// 14. Generate PDF Report
adminRouter.get('/reports/pdf', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    const analytics = await getBusinessAnalytics({ startDate, endDate });

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = 750;

    // Title
    page.drawText('Business Report', {
      x: 50,
      y: yPosition,
      size: 24,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 30;

    page.drawText(`Generated: ${new Date().toLocaleString()}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
    yPosition -= 40;

    // Summary
    page.drawText('Summary Metrics', {
      x: 50,
      y: yPosition,
      size: 16,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 25;

    const summaryText = [
      `Total Orders: ${analytics.summary.totalOrders}`,
      `Active Orders: ${analytics.summary.activeOrders}`,
      `Cancelled Orders: ${analytics.summary.cancelledOrders}`,
      `Completed Orders: ${analytics.summary.completedOrders}`,
      `Total Units Sold: ${analytics.summary.totalUnitsSold}`,
      `Total Revenue: ₹${analytics.summary.totalRevenue}`,
      `Collected Revenue: ₹${analytics.summary.collectedRevenue}`,
      `Total COGS: ₹${analytics.summary.totalCOGS}`,
      `Gross Profit: ₹${analytics.summary.grossProfit}`,
      `Net Profit: ₹${analytics.summary.netProfit}`,
      `Profit Margin: ${analytics.summary.profitMargin}%`,
    ];

    summaryText.forEach((text) => {
      page.drawText(text, {
        x: 50,
        y: yPosition,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 18;
    });

    yPosition -= 20;

    // Delivery Analytics
    page.drawText('Delivery Analytics', {
      x: 50,
      y: yPosition,
      size: 16,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 25;

    const deliveryText = [
      `Delivery Orders: ${analytics.deliveryAnalytics.deliveryOrders}`,
      `Pickup Orders: ${analytics.deliveryAnalytics.pickupOrders}`,
      `Delivery Revenue: ₹${analytics.deliveryAnalytics.deliveryRevenue}`,
      `Pickup Revenue: ₹${analytics.deliveryAnalytics.pickupRevenue}`,
    ];

    deliveryText.forEach((text) => {
      page.drawText(text, {
        x: 50,
        y: yPosition,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 18;
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=business-report-${Date.now()}.pdf`
    );

    res.send(Buffer.from(pdfBytes));
  } catch (err: any) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

// ============ BULK PRODUCT IMPORT ============

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only JPG, PNG, and PDF are supported.`));
    }
  },
});

// 15. Import Products Preview - Extract and validate
adminRouter.post(
  '/products/import/preview',
  requireAdminAuth,
  upload.single('document'),
  async (req: AuthenticatedRequest & { file?: Express.Multer.File }, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      console.log(`📄 Processing import document: ${req.file.originalname} (${req.file.size} bytes)`);

      // Extract products from document using OCR
      const extractedProducts = await extractProductsFromDocument(
        req.file.buffer,
        req.file.mimetype
      );

      console.log(`✅ Extracted ${extractedProducts.length} products from document`);

      if (extractedProducts.length === 0) {
        res.status(400).json({
          error: 'No product data found in document. Please check the document content.',
          preview: { totalCount: 0, validCount: 0, duplicateCount: 0, invalidCount: 0, products: [] },
        });
        return;
      }

      // Validate products
      const preview = await validateBulkImport(extractedProducts);

      console.log(
        `📊 Validation complete: ${preview.validCount} valid, ${preview.duplicateCount} duplicates, ${preview.invalidCount} invalid`
      );

      res.json({
        success: true,
        preview,
        message: `Extracted ${extractedProducts.length} products. ${preview.validCount} ready to import, ${preview.duplicateCount} duplicates skipped.`,
      });
    } catch (err: any) {
      console.error('Import preview error:', err);
      res.status(500).json({
        error: err.message || 'Failed to process import document',
      });
    }
  }
);

// 16. Import Products Process - Save validated products
adminRouter.post(
  '/products/import/process',
  requireAdminAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { productsToImport } = req.body;

      if (!Array.isArray(productsToImport) || productsToImport.length === 0) {
        res.status(400).json({ error: 'No products to import' });
        return;
      }

      const results = {
        imported: [] as IProduct[],
        duplicates: [] as Array<{ name: any; brand: any; reason: string }>,
        errors: [] as Array<{ name: any; reason: any }>,
        summary: {
          totalProcessed: productsToImport.length,
          successCount: 0,
          duplicateCount: 0,
          errorCount: 0,
        },
      };

      // Get existing products for duplicate checking
      const existingProducts = await getProducts();
      const importedProducts = [];

      for (const productData of productsToImport) {
        try {
          // Check for duplicates before creating
          const isDuplicate = existingProducts.some(
            (p) =>
              p.brand?.toLowerCase() === productData.brand?.toLowerCase() &&
              p.flavor?.toLowerCase() === productData.flavor?.toLowerCase() &&
              p.mrp === productData.mrp &&
              p.size === productData.size
          );

          if (isDuplicate) {
            results.duplicates.push({
              name: productData.name,
              brand: productData.brand,
              reason: 'Duplicate product (same brand, flavor, price, size)',
            });
            results.summary.duplicateCount++;
            continue;
          }

          // Create product
          const newProduct = await createProduct({
            name: productData.name,
            description: productData.description || `${productData.brand || 'Product'} - Premium Snack`,
            mrp: productData.mrp,
            sellingPrice: productData.sellingPrice,
            stock: productData.stock,
            category: productData.category,
            imageUrl: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd94548?auto=format&fit=crop&w=500&q=60', // Placeholder
            available: true,
            isSpecial: false,
            isVeg: true,
            brand: productData.brand,
            flavor: productData.flavor,
            size: productData.size,
            weight: productData.weight,
          });

          results.imported.push(newProduct);
          importedProducts.push(newProduct);
          results.summary.successCount++;
          existingProducts.push(newProduct);
        } catch (err: any) {
          results.errors.push({
            name: productData.name || 'Unknown',
            reason: err.message || 'Failed to create product',
          });
          results.summary.errorCount++;
        }
      }

      console.log(
        `✅ Import completed: ${results.summary.successCount} imported, ${results.summary.duplicateCount} duplicates, ${results.summary.errorCount} errors`
      );

      res.json({
        success: true,
        results,
        message: `Successfully imported ${results.summary.successCount} products. ${results.summary.duplicateCount} duplicates skipped, ${results.summary.errorCount} errors.`,
      });
    } catch (err: any) {
      console.error('Import process error:', err);
      res.status(500).json({
        error: err.message || 'Failed to import products',
      });
    }
  }
);

// ============ BULK DELETE ============

// 17. Bulk Delete Products
adminRouter.post('/products/bulk-delete', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      res.status(400).json({ error: 'No products selected for deletion' });
      return;
    }

    const results = {
      deleted: [] as Array<{ id: string; name: string }>,
      notFound: [] as Array<{ id: string; reason: string }>,
      errors: [] as Array<{ id: string; reason: string }>,
      summary: {
        totalRequested: productIds.length,
        successCount: 0,
        notFoundCount: 0,
        errorCount: 0,
      },
    };

    for (const productId of productIds) {
      try {
        // Check if product exists
        const product = await getProductById(productId);
        if (!product) {
          results.notFound.push({ id: productId, reason: 'Product not found' });
          results.summary.notFoundCount++;
          continue;
        }

        // Delete product
        const ok = await deleteProduct(productId);
        if (ok) {
          results.deleted.push({
            id: productId,
            name: product.name,
          });
          results.summary.successCount++;
        } else {
          results.errors.push({
            id: productId,
            reason: 'Could not delete product',
          });
          results.summary.errorCount++;
        }
      } catch (err: any) {
        results.errors.push({
          id: productId,
          reason: err.message || 'Unexpected error during deletion',
        });
        results.summary.errorCount++;
      }
    }

    console.log(
      `🗑️  Bulk delete completed: ${results.summary.successCount} deleted, ${results.summary.notFoundCount} not found, ${results.summary.errorCount} errors`
    );

    res.json({
      success: true,
      results,
      message: `Deleted ${results.summary.successCount} products. ${results.summary.notFoundCount} not found, ${results.summary.errorCount} errors.`,
    });
  } catch (err: any) {
    console.error('Bulk delete error:', err);
    res.status(500).json({
      error: err.message || 'Failed to delete products',
    });
  }
});

// Helper function to generate slug for imported products
function generateImportSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-4)}`
  );
}
