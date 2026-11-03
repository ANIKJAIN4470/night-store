import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { CustomerModel } from './models/Customer.js';

const JWT_SECRET = process.env.JWT_SECRET || 'papis-kitchen-customer-secret-key-2026';

// In-memory rate limiting for registration and login
const authRateLimitMap = new Map<string, { attempts: number; lockUntil: number }>();

export function generateCustomerToken(payload: { id: string; email: string; name: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 24 * 30; // 30 days token for customers
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp, type: 'customer' })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyCustomerToken(token: string): { id: string; email: string; name: string; type: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    // Ensure it's a customer token, not admin
    if (payload.type !== 'customer') {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function checkAuthRateLimit(ip: string, action: 'login' | 'register'): { allowed: boolean; waitSeconds?: number } {
  const key = `${ip}:${action}`;
  const record = authRateLimitMap.get(key);
  const now = Date.now();

  if (!record) {
    return { allowed: true };
  }

  if (record.lockUntil > now) {
    const waitSeconds = Math.ceil((record.lockUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  if (record.lockUntil > 0 && record.lockUntil <= now) {
    authRateLimitMap.delete(key);
  }

  return { allowed: true };
}

export function recordFailedAttempt(ip: string, action: 'login' | 'register') {
  const key = `${ip}:${action}`;
  const record = authRateLimitMap.get(key) || { attempts: 0, lockUntil: 0 };
  record.attempts += 1;

  // After 5 failed attempts, lock for 2 minutes (reduced from 15)
  if (record.attempts >= 5) {
    record.lockUntil = Date.now() + 2 * 60 * 1000;
  }

  authRateLimitMap.set(key, record);
}

export function clearAuthFailures(ip: string, action: 'login' | 'register') {
  const key = `${ip}:${action}`;
  authRateLimitMap.delete(key);
}

export interface AuthenticatedCustomerRequest extends Request {
  customer?: { id: string; email: string; name: string };
}

export function requireCustomerAuth(req: AuthenticatedCustomerRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Check customer cookie
  if (!token && (req as any).cookies?.papis_customer_token) {
    token = (req as any).cookies.papis_customer_token;
  }

  if (!token) {
    res.status(401).json({ error: 'Customer authentication token required' });
    return;
  }

  const payload = verifyCustomerToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired customer token' });
    return;
  }

  req.customer = payload;
  next();
}

export async function findCustomerByEmail(email: string) {
  try {
    const normalized = email.toLowerCase().trim();
    // Try MongoDB first if available
    try {
      const customer = await CustomerModel.findOne({ normalizedEmail: normalized });
      if (customer) return customer;
    } catch (mongoErr) {
      // MongoDB not connected, fall through to file-based store
    }

    // Fall back to file-based store
    const { localStore } = await import('./db.js');
    const fileCustomer = localStore?.customers?.find(
      (c: any) => c.normalizedEmail === normalized
    );
    if (fileCustomer) {
      // Wrap file customer in a document-like object that mimics Mongoose
      return {
        _id: fileCustomer.id,
        name: fileCustomer.name,
        email: fileCustomer.email,
        normalizedEmail: fileCustomer.normalizedEmail,
        phone: fileCustomer.phone,
        passwordHash: fileCustomer.passwordHash,
        isEmailVerified: fileCustomer.isEmailVerified,
      } as any;
    }
    return null;
  } catch (err) {
    console.error('findCustomerByEmail error:', err);
    return null;
  }
}

export async function createCustomer(name: string, email: string, phone: string, passwordHash: string) {
  const normalized = email.toLowerCase().trim();

  // Try MongoDB first if available
  try {
    const customer = await CustomerModel.create({
      name: name.trim(),
      email,
      normalizedEmail: normalized,
      phone: phone.trim(),
      passwordHash,
      isEmailVerified: false,
    });
    return customer;
  } catch (mongoErr: any) {
    console.warn('MongoDB create failed, using file-based store:', mongoErr.message);
  }

  // Fall back to file-based store
  try {
    const { localStore, saveLocalStore } = await import('./db.js');

    // Ensure customers array exists
    if (!localStore.customers) {
      localStore.customers = [];
    }

    const customerId = crypto.randomUUID();
    const newCustomer = {
      id: customerId,
      name: name.trim(),
      email,
      normalizedEmail: normalized,
      phone: phone.trim(),
      passwordHash,
      isEmailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.customers.push(newCustomer);
    saveLocalStore();

    // Return document-like object that mimics Mongoose
    return {
      _id: customerId,
      ...newCustomer,
    } as any;
  } catch (fileErr) {
    console.error('File-based customer creation failed:', fileErr);
    throw new Error('Failed to create customer account');
  }
}
