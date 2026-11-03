import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { IProduct, IOrder, ISettings, IAdminUser, OrderStatus, PaymentStatus } from './types.js';
import { initialProducts, initialSettings } from './seedData.js';
import { ProductModel } from './models/Product.js';
import { OrderModel } from './models/Order.js';
import { AdminModel } from './models/Admin.js';
import { SettingsModel } from './models/Settings.js';
import { CustomerModel } from './models/Customer.js';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'papis_kitchen.json');

interface FileStoreData {
  products: IProduct[];
  orders: IOrder[];
  settings: ISettings;
  admins: IAdminUser[];
  customers?: Array<{
    id: string;
    name: string;
    email: string;
    normalizedEmail: string;
    phone: string;
    passwordHash: string;
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
}

let isMongoConnected = false;
let mongoError: string | null = null;

// In-memory / file cache
export let localStore: FileStoreData = {
  products: [],
  orders: [],
  settings: { ...initialSettings },
  admins: [],
  customers: [],
};

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadLocalStore() {
  try {
    ensureDataDirectory();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      localStore = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read local JSON store, using memory fallback:', err);
  }
}

function saveLocalStore() {
  try {
    ensureDataDirectory();
    fs.writeFileSync(DATA_FILE, JSON.stringify(localStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local store:', err);
  }
}

export { saveLocalStore };

export async function initDatabase() {
  loadLocalStore();

  const mongoUri = process.env.MONGODB_URI;
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && (!mongoUri || mongoUri.trim() === '')) {
    throw new Error('MONGODB_URI is required in production. Refusing to start with ephemeral local storage.');
  }
  if (mongoUri && mongoUri.trim() !== '') {
    try {
      console.log('Attempting MongoDB connection...');
      await mongoose.connect(mongoUri, {
        dbName: process.env.DATABASE_NAME || 'papi',
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      isMongoConnected = true;
      mongoError = null;
      console.log('✅ Connected to MongoDB successfully!');
    } catch (err: any) {
      console.error('❌ MongoDB connection failed:', err.message);
      console.error('   Connection string (masked):', mongoUri.replace(/:[^@]+@/, ':***@'));
      console.warn('⚠️  Falling back to local persistent store');
      isMongoConnected = false;
      mongoError = err.message;
      if (isProduction) {
        throw new Error(`MongoDB connection failed in production: ${err.message}`);
      }
    }
  } else {
    isMongoConnected = false;
    mongoError = 'No MONGODB_URI configured. Operating in local persistent store mode.';
  }

  // Seed default admin and products if needed
  await seedInitialData();
}

export function getDatabaseStatus() {
  return {
    isMongoConnected,
    mongoConfigured: !!(process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== ''),
    databaseType: isMongoConnected ? 'MongoDB / Mongoose' : 'Local Persistent JSON Store',
    mongoError,
  };
}

export async function seedInitialData() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!';

  if (isMongoConnected) {
    try {
      // Check admin
      const adminCount = await AdminModel.countDocuments();
      if (adminCount === 0) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await AdminModel.create({
          username: adminUsername,
          normalizedUsername: adminUsername.toLowerCase(),
          passwordHash,
          role: 'admin',
        });
        console.log(`Seeded initial MongoDB admin: ${adminUsername}`);
      }

      // Check settings
      const settingsCount = await SettingsModel.countDocuments();
      if (settingsCount === 0) {
        await SettingsModel.create({
          ...initialSettings,
        });
        console.log('Seeded default business settings in MongoDB.');
      }

      // Check products
      const productCount = await ProductModel.countDocuments();
      if (productCount === 0) {
        for (const p of initialProducts) {
          await ProductModel.create(p);
        }
        console.log(`Seeded ${initialProducts.length} snack products in MongoDB.`);
      }
    } catch (err) {
      console.error('Error during MongoDB seeding:', err);
    }
  } else {
    // Local store seeding
    if (localStore.admins.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const newAdmin: IAdminUser = {
        id: crypto.randomUUID(),
        username: adminUsername,
        passwordHash,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStore.admins.push(newAdmin);
      saveLocalStore();
      console.log(`Seeded initial local admin: ${adminUsername}`);
    }

    if (!localStore.settings || !localStore.settings.businessName) {
      localStore.settings = { ...initialSettings };
      saveLocalStore();
    }

    if (!localStore.products || localStore.products.length === 0) {
      localStore.products = initialProducts.map((p) => ({
        ...p,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      saveLocalStore();
      console.log(`Seeded ${localStore.products.length} snack products in local store.`);
    }
  }
}

// ---------------- PRODUCTS ----------------

export async function getProducts(options?: { category?: string; search?: string; availableOnly?: boolean }) {
  if (isMongoConnected) {
    const filter: any = {};
    if (options?.category && options.category !== 'All Snacks') {
      filter.category = options.category;
    }
    if (options?.availableOnly) {
      filter.available = true;
    }
    if (options?.search) {
      const regex = new RegExp(options.search, 'i');
      filter.$or = [{ name: regex }, { description: regex }];
    }
    const docs = await ProductModel.find(filter).sort({ isSpecial: -1, sellingPrice: 1 }).lean();
    return docs.map((d: any) => ({
      id: d._id.toString(),
      name: d.name,
      slug: d.slug,
      description: d.description,
      mrp: d.mrp,
      sellingPrice: d.sellingPrice,
      stock: d.stock || 0,
      category: d.category,
      imageUrl: d.imageUrl,
      available: d.available,
      isSpecial: d.isSpecial,
      isVeg: d.isVeg,
      brand: d.brand,
      flavor: d.flavor,
      size: d.size,
      weight: d.weight,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })) as IProduct[];
  } else {
    let prods = [...localStore.products];
    if (options?.category && options.category !== 'All Snacks') {
      prods = prods.filter((p) => p.category === options.category);
    }
    if (options?.availableOnly) {
      prods = prods.filter((p) => p.available);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      prods = prods.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return prods.sort((a, b) => {
      if (a.isSpecial && !b.isSpecial) return -1;
      if (!a.isSpecial && b.isSpecial) return 1;
      return (a.sellingPrice || a.price || 0) - (b.sellingPrice || b.price || 0);
    });
  }
}

export async function getProductById(id: string): Promise<IProduct | null> {
  if (isMongoConnected) {
    try {
      const doc: any = await ProductModel.findById(id).lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        name: doc.name,
        slug: doc.slug,
        description: doc.description,
        mrp: doc.mrp,
        sellingPrice: doc.sellingPrice,
        stock: doc.stock || 0,
        category: doc.category,
        imageUrl: doc.imageUrl,
        available: doc.available,
        isSpecial: doc.isSpecial,
        isVeg: doc.isVeg,
        brand: doc.brand,
        flavor: doc.flavor,
        size: doc.size,
        weight: doc.weight,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    } catch {
      return null;
    }
  } else {
    const p = localStore.products.find((prod) => prod.id === id);
    return p ? { ...p } : null;
  }
}

export async function createProduct(input: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt' | 'slug'>): Promise<IProduct> {
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
  if (isMongoConnected) {
    const doc: any = await ProductModel.create({
      ...input,
      slug,
    });
    return {
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description,
      mrp: doc.mrp,
      sellingPrice: doc.sellingPrice,
      stock: doc.stock || 0,
      category: doc.category,
      imageUrl: doc.imageUrl,
      available: doc.available,
      isSpecial: doc.isSpecial,
      isVeg: doc.isVeg,
      brand: doc.brand,
      flavor: doc.flavor,
      size: doc.size,
      weight: doc.weight,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  } else {
    const now = new Date().toISOString();
    const newProd: IProduct = {
      ...input,
      id: crypto.randomUUID(),
      slug,
      createdAt: now,
      updatedAt: now,
    };
    localStore.products.push(newProd);
    saveLocalStore();
    return newProd;
  }
}

export async function updateProduct(id: string, updates: Partial<IProduct>): Promise<IProduct | null> {
  if (isMongoConnected) {
    try {
      const doc: any = await ProductModel.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        name: doc.name,
        slug: doc.slug,
        description: doc.description,
        mrp: doc.mrp,
        sellingPrice: doc.sellingPrice,
        stock: doc.stock || 0,
        category: doc.category,
        imageUrl: doc.imageUrl,
        available: doc.available,
        isSpecial: doc.isSpecial,
        isVeg: doc.isVeg,
        brand: doc.brand,
        flavor: doc.flavor,
        size: doc.size,
        weight: doc.weight,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    } catch {
      return null;
    }
  } else {
    const index = localStore.products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    localStore.products[index] = {
      ...localStore.products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveLocalStore();
    return localStore.products[index];
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isMongoConnected) {
    try {
      const res = await ProductModel.findByIdAndDelete(id);
      return !!res;
    } catch {
      return false;
    }
  } else {
    const initialLen = localStore.products.length;
    localStore.products = localStore.products.filter((p) => p.id !== id);
    saveLocalStore();
    return localStore.products.length < initialLen;
  }
}

// ---------------- ORDERS ----------------

export async function createOrder(orderData: Omit<IOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<IOrder> {
  if (isMongoConnected) {
    const doc: any = await OrderModel.create(orderData);
    return {
      id: doc._id.toString(),
      orderNumber: doc.orderNumber,
      trackingToken: doc.trackingToken,
      items: doc.items,
      customerName: doc.customerName,
      customerPhone: doc.customerPhone,
      deliveryMethod: doc.deliveryMethod || 'Room Delivery',
      hostelName: doc.hostelName,
      hostelBlock: doc.hostelBlock,
      roomNumber: doc.roomNumber,
      deliveryInstructions: doc.deliveryInstructions,
      subtotal: doc.subtotal,
      deliveryFee: doc.deliveryFee,
      discount: doc.discount || 0,
      total: doc.total,
      paymentMethod: doc.paymentMethod,
      paymentStatus: doc.paymentStatus,
      paymentReference: doc.paymentReference,
      orderStatus: doc.orderStatus,
      cancellationReason: doc.cancellationReason,
      statusHistory: doc.statusHistory?.map((h: any) => ({
        status: h.status,
        timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
        note: h.note,
      })) || [],
      idempotencyKey: doc.idempotencyKey,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  } else {
    const now = new Date().toISOString();
    const newOrder: IOrder = {
      ...orderData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    localStore.orders.unshift(newOrder);
    saveLocalStore();
    return newOrder;
  }
}

export async function getOrderByNumber(orderNumber: string): Promise<IOrder | null> {
  if (isMongoConnected) {
    try {
      const doc: any = await OrderModel.findOne({ orderNumber }).lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        orderNumber: doc.orderNumber,
        trackingToken: doc.trackingToken,
        items: doc.items,
        customerName: doc.customerName,
        customerPhone: doc.customerPhone,
        deliveryMethod: doc.deliveryMethod || 'Room Delivery',
        hostelName: doc.hostelName,
        hostelBlock: doc.hostelBlock,
        roomNumber: doc.roomNumber,
        deliveryInstructions: doc.deliveryInstructions,
        subtotal: doc.subtotal,
        deliveryFee: doc.deliveryFee,
        discount: doc.discount || 0,
        total: doc.total,
        paymentMethod: doc.paymentMethod,
        paymentStatus: doc.paymentStatus,
        paymentReference: doc.paymentReference,
        orderStatus: doc.orderStatus,
        cancellationReason: doc.cancellationReason,
        statusHistory: doc.statusHistory?.map((h: any) => ({
          status: h.status,
          timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
          note: h.note,
        })) || [],
        idempotencyKey: doc.idempotencyKey,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    } catch {
      return null;
    }
  } else {
    const o = localStore.orders.find((ord) => ord.orderNumber === orderNumber);
    return o ? { ...o } : null;
  }
}

export async function getOrderById(id: string): Promise<IOrder | null> {
  if (isMongoConnected) {
    try {
      const doc: any = await OrderModel.findById(id).lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        orderNumber: doc.orderNumber,
        trackingToken: doc.trackingToken,
        items: doc.items,
        customerName: doc.customerName,
        customerPhone: doc.customerPhone,
        deliveryMethod: doc.deliveryMethod || 'Room Delivery',
        hostelName: doc.hostelName,
        hostelBlock: doc.hostelBlock,
        roomNumber: doc.roomNumber,
        deliveryInstructions: doc.deliveryInstructions,
        subtotal: doc.subtotal,
        deliveryFee: doc.deliveryFee,
        discount: doc.discount || 0,
        total: doc.total,
        paymentMethod: doc.paymentMethod,
        paymentStatus: doc.paymentStatus,
        paymentReference: doc.paymentReference,
        orderStatus: doc.orderStatus,
        cancellationReason: doc.cancellationReason,
        statusHistory: doc.statusHistory?.map((h: any) => ({
          status: h.status,
          timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
          note: h.note,
        })) || [],
        idempotencyKey: doc.idempotencyKey,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    } catch {
      return null;
    }
  } else {
    const o = localStore.orders.find((ord) => ord.id === id);
    return o ? { ...o } : null;
  }
}

export async function getOrders(options?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  date?: string;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;

  if (isMongoConnected) {
    const filter: any = {};
    if (options?.status && options.status !== 'All') {
      filter.orderStatus = options.status;
    }
    if (options?.search) {
      const regex = new RegExp(options.search, 'i');
      filter.$or = [
        { orderNumber: regex },
        { customerName: regex },
        { customerPhone: regex },
        { roomNumber: regex },
        { hostelName: regex },
      ];
    }
    if (options?.date) {
      const start = new Date(options.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(options.date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const total = await OrderModel.countDocuments(filter);
    const docs: any[] = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const orders = docs.map((doc) => ({
      id: doc._id.toString(),
      orderNumber: doc.orderNumber,
      trackingToken: doc.trackingToken,
      items: doc.items,
      customerName: doc.customerName,
      customerPhone: doc.customerPhone,
      deliveryMethod: doc.deliveryMethod || 'Room Delivery',
      hostelName: doc.hostelName,
      hostelBlock: doc.hostelBlock,
      roomNumber: doc.roomNumber,
      deliveryInstructions: doc.deliveryInstructions,
      subtotal: doc.subtotal,
      deliveryFee: doc.deliveryFee,
      total: doc.total,
      paymentMethod: doc.paymentMethod,
      paymentStatus: doc.paymentStatus,
      paymentReference: doc.paymentReference,
      orderStatus: doc.orderStatus,
      cancellationReason: doc.cancellationReason,
      statusHistory: doc.statusHistory?.map((h: any) => ({
        status: h.status,
        timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
        note: h.note,
      })) || [],
      idempotencyKey: doc.idempotencyKey,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    }));

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  } else {
    let list = [...localStore.orders];

    if (options?.status && options.status !== 'All') {
      list = list.filter((o) => o.orderStatus === options.status);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          (o.roomNumber || '').toLowerCase().includes(q) ||
          o.hostelName.toLowerCase().includes(q)
      );
    }
    if (options?.date) {
      const filterDateStr = options.date;
      list = list.filter((o) => o.createdAt.startsWith(filterDateStr));
    }

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      orders: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string
): Promise<IOrder | null> {
  const timestamp = new Date().toISOString();
  if (isMongoConnected) {
    try {
      const doc: any = await OrderModel.findById(orderId);
      if (!doc) return null;
      doc.orderStatus = newStatus;
      doc.statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        note,
      });
      if (newStatus === 'Completed' && doc.paymentMethod === 'Cash on Delivery') {
        doc.paymentStatus = 'Paid';
      }
      const now = new Date();
      if (newStatus === 'Accepted') doc.acceptedAt = now;
      if (newStatus === 'Preparing') doc.preparingStartedAt = now;
      if (newStatus === 'Out for Delivery' || newStatus === 'Ready for Pickup') doc.readyAt = now;
      if (newStatus === 'Completed') doc.completedAt = now;
      if (newStatus === 'Cancelled') doc.cancelledAt = now;
      await doc.save();
      return getOrderById(orderId);
    } catch {
      return null;
    }
  } else {
    const order = localStore.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) return null;
    order.orderStatus = newStatus;
    order.updatedAt = timestamp;
    order.statusHistory.push({
      status: newStatus,
      timestamp,
      note,
    });
    if (newStatus === 'Completed' && order.paymentMethod === 'Cash on Delivery') {
      order.paymentStatus = 'Paid';
    }
    if (newStatus === 'Accepted') order.acceptedAt = timestamp;
    if (newStatus === 'Preparing') order.preparingStartedAt = timestamp;
    if (newStatus === 'Out for Delivery' || newStatus === 'Ready for Pickup') order.readyAt = timestamp;
    if (newStatus === 'Completed') order.completedAt = timestamp;
    if (newStatus === 'Cancelled') order.cancelledAt = timestamp;
    saveLocalStore();
    return { ...order };
  }
}

export async function updateOrderPayment(
  orderId: string,
  paymentStatus: PaymentStatus,
  reference?: string
): Promise<IOrder | null> {
  if (isMongoConnected) {
    try {
      const updateData: any = { paymentStatus, updatedAt: new Date() };
      if (reference) updateData.paymentReference = reference;
      await OrderModel.findByIdAndUpdate(orderId, updateData);
      return getOrderById(orderId);
    } catch {
      return null;
    }
  } else {
    const order = localStore.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) return null;
    order.paymentStatus = paymentStatus;
    if (reference) order.paymentReference = reference;
    order.updatedAt = new Date().toISOString();
    saveLocalStore();
    return { ...order };
  }
}

export async function cancelOrder(
  orderId: string,
  reason: string,
  isCustomer: boolean = false
): Promise<{ success: boolean; message: string; order?: IOrder }> {
  const order = await getOrderById(orderId);
  if (!order) {
    return { success: false, message: 'Order not found' };
  }

  // Business rule: Customer can only cancel if status is 'Pending'
  if (isCustomer && order.orderStatus !== 'Pending') {
    return {
      success: false,
      message: `Cannot cancel order at "${order.orderStatus}" stage. The kitchen has already started preparing your snacks.`,
    };
  }

  if (order.orderStatus === 'Completed' || order.orderStatus === 'Cancelled') {
    return {
      success: false,
      message: `Order is already ${order.orderStatus.toLowerCase()}`,
    };
  }

  const updated = await updateOrderStatus(order.id, 'Cancelled', `Cancelled: ${reason}`);
  if (updated) {
    updated.cancellationReason = reason;
    if (isMongoConnected) {
      await OrderModel.findByIdAndUpdate(order.id, { cancellationReason: reason });
    } else {
      const localOrd = localStore.orders.find((o) => o.id === order.id);
      if (localOrd) {
        localOrd.cancellationReason = reason;
        saveLocalStore();
      }
    }
    return { success: true, message: 'Order has been cancelled', order: updated };
  }
  return { success: false, message: 'Could not update order status' };
}

// ---------------- SETTINGS ----------------

export async function getSettings(): Promise<ISettings> {
  if (isMongoConnected) {
    try {
      const doc: any = await SettingsModel.findOne().lean();
      if (doc) {
        return {
          businessName: doc.businessName,
          tagline: doc.tagline,
          contactPhone: doc.contactPhone,
          whatsappPhone: doc.whatsappPhone,
          openingTime: doc.openingTime,
          closingTime: doc.closingTime,
          isOpen: doc.isOpen,
          deliveryFee: doc.deliveryFee,
          minOrderAmount: doc.minOrderAmount,
          estimatedDeliveryTime: doc.estimatedDeliveryTime,
          acceptedHostels: doc.acceptedHostels || [],
          paymentMethods: { cod: true, upi: true },
          upiQrUrl: '/upi-qr.jpe',
          announcement: doc.announcement?.replace(/cash on delivery\s*&\s*upi accepted/i, 'cash on delivery available'),
          updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
        };
      }
    } catch (err) {
      console.error('Error fetching settings from Mongo:', err);
    }
  }
  return { ...localStore.settings };
}

export async function updateSettings(updates: Partial<ISettings>): Promise<ISettings> {
  const now = new Date().toISOString();
  if (isMongoConnected) {
    try {
      let doc: any = await SettingsModel.findOne();
      if (!doc) {
        doc = await SettingsModel.create({ ...initialSettings, ...updates });
      } else {
        Object.assign(doc, updates);
        await doc.save();
      }
      return getSettings();
    } catch (err) {
      console.error('Error updating settings in Mongo:', err);
    }
  }
  localStore.settings = {
    ...localStore.settings,
    ...updates,
    updatedAt: now,
  };
  saveLocalStore();
  return { ...localStore.settings };
}

// ---------------- ADMIN USERS ----------------

export async function findAdminByUsername(username: string): Promise<IAdminUser | null> {
  const normalized = username.trim().toLowerCase();
  if (isMongoConnected) {
    try {
      const doc: any = await AdminModel.findOne({ normalizedUsername: normalized }).lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        username: doc.username,
        passwordHash: doc.passwordHash,
        role: doc.role,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    } catch {
      return null;
    }
  } else {
    const admin = localStore.admins.find((a) => a.username.toLowerCase() === normalized);
    return admin ? { ...admin } : null;
  }
}

export async function findAdminById(id: string): Promise<IAdminUser | null> {
  if (isMongoConnected) {
    try {
      const doc: any = await AdminModel.findById(id).lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        username: doc.username,
        passwordHash: doc.passwordHash,
        role: doc.role,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    } catch {
      return null;
    }
  } else {
    const admin = localStore.admins.find((a) => a.id === id);
    return admin ? { ...admin } : null;
  }
}

// ---------------- DASHBOARD STATS ----------------

export async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0];

  let allOrders: IOrder[] = [];
  if (isMongoConnected) {
    const docs: any[] = await OrderModel.find().lean();
    allOrders = docs.map((d) => ({
      id: d._id.toString(),
      orderNumber: d.orderNumber,
      trackingToken: d.trackingToken,
      customerId: d.customerId,
      items: d.items,
      customerName: d.customerName,
      customerPhone: d.customerPhone,
      deliveryMethod: d.deliveryMethod || 'Room Delivery',
      hostelName: d.hostelName,
      hostelBlock: d.hostelBlock,
      roomNumber: d.roomNumber,
      subtotal: d.subtotal,
      deliveryFee: d.deliveryFee,
      discount: d.discount || 0,
      total: d.total,
      paymentMethod: d.paymentMethod,
      paymentStatus: d.paymentStatus,
      orderStatus: d.orderStatus,
      statusHistory: [],
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
  } else {
    allOrders = [...localStore.orders];
  }

  const todayOrders = allOrders.filter((o) => o.createdAt.startsWith(today));

  const stats = {
    totalOrdersToday: todayOrders.length,
    awaitingConfirmation: allOrders.filter((o) => o.orderStatus === 'Pending').length,
    inKitchenPreparing: allOrders.filter((o) => o.orderStatus === 'Preparing').length,
    outForDelivery: allOrders.filter((o) => o.orderStatus === 'Out for Delivery').length,
    readyForPickup: allOrders.filter((o) => o.orderStatus === 'Ready for Pickup').length,
    completedToday: todayOrders.filter((o) => o.orderStatus === 'Completed').length,
    todayOrderValue: todayOrders
      .filter((o) => o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0),
    todayCollectedRevenue: todayOrders
      .filter((o) => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + o.total, 0),
    totalAllTimeOrders: allOrders.length,
    allTimeCollectedRevenue: allOrders
      .filter((o) => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + o.total, 0),
    recentOrders: allOrders.slice(0, 7),
  };

  return stats;
}

// ---------------- BUSINESS ANALYTICS ----------------

export async function getBusinessAnalytics(options?: {
  startDate?: string;
  endDate?: string;
}) {
  let allOrders: IOrder[] = [];
  let allProducts: IProduct[] = [];

  if (isMongoConnected) {
    const orderDocs: any[] = await OrderModel.find().lean();
    const productDocs: any[] = await ProductModel.find().lean();

    allOrders = orderDocs.map((d) => ({
      id: d._id.toString(),
      orderNumber: d.orderNumber,
      trackingToken: d.trackingToken,
      customerId: d.customerId,
      items: d.items,
      customerName: d.customerName,
      customerPhone: d.customerPhone,
      deliveryMethod: d.deliveryMethod,
      hostelName: d.hostelName,
      hostelBlock: d.hostelBlock,
      roomNumber: d.roomNumber,
      deliveryInstructions: d.deliveryInstructions,
      subtotal: d.subtotal,
      deliveryFee: d.deliveryFee,
      discount: d.discount || 0,
      total: d.total,
      paymentMethod: d.paymentMethod,
      paymentStatus: d.paymentStatus,
      orderStatus: d.orderStatus,
      statusHistory: [],
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));

    allProducts = productDocs.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      description: p.description,
      mrp: p.mrp,
      sellingPrice: p.sellingPrice,
      stock: p.stock || 0,
      category: p.category,
      imageUrl: p.imageUrl,
      available: p.available,
      isSpecial: p.isSpecial,
      isVeg: p.isVeg,
      brand: p.brand,
      flavor: p.flavor,
      size: p.size,
      weight: p.weight,
      costPrice: p.costPrice || 0,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  } else {
    allOrders = [...localStore.orders];
    allProducts = [...localStore.products];
  }

  // Filter by date range if provided
  let filteredOrders = allOrders;
  if (options?.startDate) {
    filteredOrders = filteredOrders.filter((o) => o.createdAt >= options.startDate!);
  }
  if (options?.endDate) {
    const endDate = new Date(options.endDate);
    endDate.setHours(23, 59, 59, 999);
    filteredOrders = filteredOrders.filter((o) => new Date(o.createdAt) <= endDate);
  }

  // Calculate metrics
  const totalOrders = filteredOrders.length;
  const cancelledOrders = filteredOrders.filter((o) => o.orderStatus === 'Cancelled').length;
  const completedOrders = filteredOrders.filter((o) => o.orderStatus === 'Completed').length;
  const activeOrders = totalOrders - cancelledOrders;

  const totalRevenue = filteredOrders
    .filter((o) => o.orderStatus !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const collectedRevenue = filteredOrders
    .filter((o) => o.paymentStatus === 'Paid')
    .reduce((sum, o) => sum + o.total, 0);

  // Product-wise sales
  const productSales = new Map<string, { units: number; revenue: number; cogs: number; orders: number }>();
  let totalUnitsSold = 0;

  filteredOrders.forEach((order) => {
    if (order.orderStatus === 'Cancelled') return;

    order.items.forEach((item) => {
      const existing = productSales.get(item.productId) || { units: 0, revenue: 0, cogs: 0, orders: 0 };
      const catalogCost = allProducts.find((product) => product.id === item.productId)?.costPrice || 0;
      productSales.set(item.productId, {
        units: existing.units + item.quantity,
        revenue: existing.revenue + item.subtotal,
        cogs: existing.cogs + item.quantity * (item.unitCost ?? catalogCost),
        orders: existing.orders + 1,
      });
      totalUnitsSold += item.quantity;
    });
  });

  // Calculate COGS and profit
  let totalCOGS = 0;
  const productProfitability = allProducts.map((product) => {
    const sales = productSales.get(product.id) || { units: 0, revenue: 0, cogs: 0, orders: 0 };
    const costPrice = product.costPrice || 0;
    const revenue = sales.revenue;
    const cogs = sales.cogs;
    const grossProfit = revenue - cogs;

    totalCOGS += cogs;

    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      brand: product.brand,
      mrp: product.mrp,
      sellingPrice: product.sellingPrice,
      costPrice,
      unitsSold: sales.units,
      revenue,
      cogs,
      grossProfit,
      orders: sales.orders,
    };
  });

  const grossProfit = totalRevenue - totalCOGS;
  const operatingExpenses = 0; // Can be configured later
  const netProfit = grossProfit - operatingExpenses;

  // Delivery vs Pickup statistics
  const deliveryOrders = filteredOrders.filter((o) => o.deliveryMethod === 'Room Delivery' && o.orderStatus !== 'Cancelled').length;
  const pickupOrders = filteredOrders.filter((o) => o.deliveryMethod === 'Self Pickup' && o.orderStatus !== 'Cancelled').length;
  const deliveryRevenue = filteredOrders
    .filter((o) => o.deliveryMethod === 'Room Delivery' && o.orderStatus !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  const pickupRevenue = filteredOrders
    .filter((o) => o.deliveryMethod === 'Self Pickup' && o.orderStatus !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  // Sort products by sales
  const bestSellingProducts = [...productProfitability]
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 10);

  const lowSellingProducts = [...productProfitability]
    .filter((p) => p.unitsSold > 0)
    .sort((a, b) => a.unitsSold - b.unitsSold)
    .slice(0, 10);

  // Category-wise sales
  const categorySales = new Map<string, { units: number; revenue: number }>();
  productProfitability.forEach((p) => {
    const existing = categorySales.get(p.category) || { units: 0, revenue: 0 };
    categorySales.set(p.category, {
      units: existing.units + p.unitsSold,
      revenue: existing.revenue + p.revenue,
    });
  });

  // Order status distribution
  const statusDistribution = {
    Pending: filteredOrders.filter((o) => o.orderStatus === 'Pending').length,
    Accepted: filteredOrders.filter((o) => o.orderStatus === 'Accepted').length,
    Preparing: filteredOrders.filter((o) => o.orderStatus === 'Preparing').length,
    'Out for Delivery': filteredOrders.filter((o) => o.orderStatus === 'Out for Delivery').length,
    'Ready for Pickup': filteredOrders.filter((o) => o.orderStatus === 'Ready for Pickup').length,
    Completed: filteredOrders.filter((o) => o.orderStatus === 'Completed').length,
    Cancelled: filteredOrders.filter((o) => o.orderStatus === 'Cancelled').length,
  };

  return {
    summary: {
      totalOrders,
      activeOrders,
      cancelledOrders,
      completedOrders,
      totalUnitsSold,
      totalRevenue,
      collectedRevenue,
      totalCOGS,
      grossProfit,
      operatingExpenses,
      netProfit,
      profitMargin: totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(2) : '0',
    },
    productAnalytics: {
      productProfitability,
      bestSellingProducts,
      lowSellingProducts,
      categorySales: Array.from(categorySales.entries()).map(([category, data]) => ({
        category,
        ...data,
      })),
    },
    deliveryAnalytics: {
      deliveryOrders,
      pickupOrders,
      deliveryRevenue,
      pickupRevenue,
    },
    statusDistribution,
    orders: filteredOrders,
  };
}
