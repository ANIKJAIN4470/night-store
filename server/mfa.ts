import crypto from 'crypto';

const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();
const trustedDevices = new Map<string, Set<string>>();

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createOTP(adminId: string): string {
  const otp = generateOTP();
  otpStore.set(adminId, { code: otp, expiresAt: Date.now() + 600000, attempts: 0 });
  return otp;
}

export function verifyOTP(adminId: string, provided: string): boolean {
  const record = otpStore.get(adminId);
  if (!record || Date.now() > record.expiresAt || record.attempts >= 3) {
    otpStore.delete(adminId);
    return false;
  }
  if (record.code !== provided) {
    record.attempts++;
    return false;
  }
  otpStore.delete(adminId);
  return true;
}

export function generateDeviceFingerprint(userAgent: string, ip: string): string {
  return crypto.createHash('sha256').update(`${userAgent}:${ip}`).digest('hex');
}

export function isDeviceTrusted(adminId: string, fingerprint: string): boolean {
  return trustedDevices.get(adminId)?.has(fingerprint) ?? false;
}

export function trustDevice(adminId: string, fingerprint: string): void {
  if (!trustedDevices.has(adminId)) trustedDevices.set(adminId, new Set());
  trustedDevices.get(adminId)!.add(fingerprint);
}
