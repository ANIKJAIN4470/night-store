import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { findAdminByUsername } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'papis-kitchen-super-secret-key-prod-2026';

// In-memory rate limiting map for login attempts: IP -> { attempts: number, lockUntil: number }
const loginRateLimitMap = new Map<string, { attempts: number; lockUntil: number }>();

// Session tracking: userId -> { loginTime, lastActivityTime, ipAddress, userAgent }
const sessionMap = new Map<string, { loginTime: number; lastActivityTime: number; ipAddress: string; userAgent: string }>();

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout

export function generateToken(payload: { id: string; username: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 24; // 24 hours token
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp, type: 'admin' })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { id: string; username: string; role: string; type?: string } | null {
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
    return payload;
  } catch {
    return null;
  }
}

export function checkLoginRateLimit(ip: string): { allowed: boolean; waitSeconds?: number } {
  const record = loginRateLimitMap.get(ip);
  const now = Date.now();
  if (!record) {
    return { allowed: true };
  }
  if (record.lockUntil > now) {
    const waitSeconds = Math.ceil((record.lockUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }
  // Reset if lock passed
  if (record.lockUntil > 0 && record.lockUntil <= now) {
    loginRateLimitMap.delete(ip);
  }
  return { allowed: true };
}

export function recordFailedLogin(ip: string) {
  const record = loginRateLimitMap.get(ip) || { attempts: 0, lockUntil: 0 };
  record.attempts += 1;
  // If 5 failed attempts, lock for 30 minutes
  if (record.attempts >= 5) {
    record.lockUntil = Date.now() + 30 * 60 * 1000;
    console.warn(`🔒 Admin login LOCKED for IP ${ip} (5 failed attempts)`);
  }
  loginRateLimitMap.set(ip, record);
}

export function clearLoginFailures(ip: string) {
  loginRateLimitMap.delete(ip);
}

/**
 * Track admin session for activity monitoring and timeout
 */
export function trackAdminSession(userId: string, ipAddress: string, userAgent: string) {
  sessionMap.set(userId, {
    loginTime: Date.now(),
    lastActivityTime: Date.now(),
    ipAddress,
    userAgent,
  });
  console.log(`✅ Admin session started: ${userId} from ${ipAddress}`);
}

/**
 * Update last activity time for admin (keeps session alive)
 */
export function updateAdminActivity(userId: string) {
  const session = sessionMap.get(userId);
  if (session) {
    session.lastActivityTime = Date.now();
  }
}

/**
 * Check if admin session is still valid (not timed out due to inactivity)
 */
export function isAdminSessionValid(userId: string): boolean {
  const session = sessionMap.get(userId);
  if (!session) {
    return false;
  }

  const inactivityTime = Date.now() - session.lastActivityTime;
  if (inactivityTime > SESSION_TIMEOUT_MS) {
    sessionMap.delete(userId);
    console.log(`⏱️  Admin session EXPIRED: ${userId} (${Math.floor(inactivityTime / 1000)}s inactivity)`);
    return false;
  }

  return true;
}

/**
 * End admin session (logout)
 */
export function endAdminSession(userId: string) {
  const session = sessionMap.get(userId);
  if (session) {
    const sessionDuration = Math.floor((Date.now() - session.loginTime) / 1000);
    console.log(`🔓 Admin session ended: ${userId} (${sessionDuration}s duration)`);
    sessionMap.delete(userId);
  }
}

/**
 * Get admin session info for security auditing
 */
export function getAdminSessionInfo(userId: string) {
  return sessionMap.get(userId);
}

export interface AuthenticatedRequest extends Request {
  adminUser?: { id: string; username: string; role: string };
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Check cookies
  if (!token && (req as any).cookies?.papis_admin_token) {
    token = (req as any).cookies.papis_admin_token;
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired admin token' });
    return;
  }

  // Check session validity (timeout check)
  if (!isAdminSessionValid(payload.id)) {
    res.status(401).json({ error: 'Admin session expired due to inactivity. Please log in again.' });
    return;
  }

  // Update activity timestamp
  updateAdminActivity(payload.id);

  req.adminUser = payload;
  next();
}
