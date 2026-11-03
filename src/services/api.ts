import { Product, BusinessSettings, Order } from '../types.js';

// Local development uses Vite's same-origin API path. Set VITE_API_BASE_URL
// on Vercel to your Railway service URL (without a trailing slash).
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Try to get customer token first, then admin token
  const customerToken = localStorage.getItem('papis_customer_token');
  const adminToken = localStorage.getItem('papis_admin_token');
  const token = customerToken || adminToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // If 401 Unauthorized, clear tokens and trigger logout event
    if (response.status === 401) {
      localStorage.removeItem('papis_admin_token');
      localStorage.removeItem('papis_customer_token');
      // Trigger logout events
      window.dispatchEvent(new CustomEvent('admin-logout'));
      window.dispatchEvent(new CustomEvent('customer-logout'));
    }

    const errorMsg = data?.error || (typeof data === 'string' ? data : 'Something went wrong');
    throw new ApiError(errorMsg, response.status);
  }

  return data as T;
}

// ---------------- PUBLIC API ----------------

export async function fetchHealth() {
  return request<{ status: string; service: string; database: any }>('/health');
}

export async function fetchProducts(params?: { category?: string; search?: string; availableOnly?: boolean }) {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'All Snacks') query.append('category', params.category);
  if (params?.search) query.append('search', params.search);
  if (params?.availableOnly) query.append('availableOnly', 'true');

  const q = query.toString();
  const res = await request<{ products: Product[] }>(`/products${q ? `?${q}` : ''}`);
  return res.products;
}

export async function fetchProductById(id: string) {
  const res = await request<{ product: Product }>(`/products/${id}`);
  return res.product;
}

export async function fetchPublicSettings() {
  const res = await request<{ settings: BusinessSettings }>('/settings/public');
  return res.settings;
}

export interface PlaceOrderPayload {
  customerName: string;
  customerPhone: string;
  deliveryMethod: 'Room Delivery' | 'Self Pickup';
  hostelName: string;
  hostelBlock?: string;
  roomNumber?: string;
  deliveryInstructions?: string;
  items: { productId: string; quantity: number }[];
  paymentMethod: 'Cash on Delivery' | 'UPI';
  idempotencyKey?: string;
  customerId?: string;
  couponCode?: string;
}

export async function placeOrder(payload: PlaceOrderPayload) {
  return request<{
    success: boolean;
    orderNumber: string;
    trackingToken: string;
    total: number;
    subtotal: number;
    deliveryFee: number;
    discount?: number;
    items: any[];
    paymentMethod: 'Cash on Delivery' | 'UPI';
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    hostelName: string;
    hostelBlock?: string;
    roomNumber: string;
    deliveryInstructions?: string;
    orderStatus: string;
    createdAt: string;
    estimatedDeliveryTime: string;
  }>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function trackOrder(orderNumber: string, token: string) {
  return request<{ order: Order }>(`/orders/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`);
}

export async function cancelOrderByCustomer(orderNumber: string, token: string, reason: string) {
  return request<{ success: boolean; message: string; order: Order }>(
    `/orders/${encodeURIComponent(orderNumber)}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({ token, reason }),
    }
  );
}

// ---------------- ADMIN API ----------------

export async function adminLogin(credentials: { username: string; password: string }) {
  const res = await request<{
    success: boolean;
    token: string;
    user: { id: string; username: string; role: string };
  }>('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  if (res.token) {
    localStorage.setItem('papis_admin_token', res.token);
  }
  return res;
}

export async function adminLogout() {
  try {
    await request('/admin/auth/logout', { method: 'POST' });
  } finally {
    localStorage.removeItem('papis_admin_token');
  }
}

export async function adminCheckMe() {
  return request<{ user: { id: string; username: string; role: string }; database: any }>('/admin/auth/me');
}

export async function adminGetDashboard() {
  return request<{
    stats: {
      totalOrdersToday: number;
      awaitingConfirmation: number;
      inKitchenPreparing: number;
      outForDelivery: number;
      deliveredToday: number;
      todayOrderValue: number;
      todayCollectedRevenue: number;
      totalAllTimeOrders: number;
      allTimeCollectedRevenue: number;
      recentOrders: Order[];
    };
    database: any;
  }>('/admin/dashboard');
}

export async function adminGetAnalytics(options?: { startDate?: string; endDate?: string }) {
  const params = new URLSearchParams();
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  const queryString = params.toString();
  return request<any>(`/admin/analytics${queryString ? `?${queryString}` : ''}`);
}

export function adminDownloadExcelReport(options?: { startDate?: string; endDate?: string }) {
  const params = new URLSearchParams();
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  const queryString = params.toString();
  downloadAdminReport(`/admin/reports/excel${queryString ? `?${queryString}` : ''}`, 'business-report.xlsx');
}

export function adminDownloadPdfReport(options?: { startDate?: string; endDate?: string }) {
  const params = new URLSearchParams();
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  const queryString = params.toString();
  downloadAdminReport(`/admin/reports/pdf${queryString ? `?${queryString}` : ''}`, 'business-report.pdf');
}

async function downloadAdminReport(endpoint: string, fallbackName: string) {
  const token = localStorage.getItem('papis_admin_token');
  const response = await fetch(`${API_BASE}${endpoint}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new ApiError('Could not download report', response.status);
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = fallbackName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function adminGetOrders(params?: {
  status?: string;
  search?: string;
  date?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'All') query.append('status', params.status);
  if (params?.search) query.append('search', params.search);
  if (params?.date) query.append('date', params.date);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  const q = query.toString();
  return request<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/admin/orders${q ? `?${q}` : ''}`);
}

export async function adminGetOrderById(id: string) {
  const res = await request<{ order: Order }>(`/admin/orders/${id}`);
  return res.order;
}

export async function adminUpdateOrderStatus(orderId: string, status: string, note?: string) {
  return request<{ success: boolean; order: Order }>(`/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  });
}

export async function adminUpdatePayment(orderId: string, paymentStatus: string, reference?: string) {
  return request<{ success: boolean; order: Order }>(`/admin/orders/${orderId}/payment`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentStatus, reference }),
  });
}

export async function adminCancelOrder(orderId: string, reason: string) {
  return request<{ success: boolean; order: Order }>(`/admin/orders/${orderId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function adminGetProducts() {
  const res = await request<{ products: Product[] }>('/admin/products');
  return res.products;
}

export async function adminCreateProduct(productData: Partial<Product>) {
  return request<{ success: boolean; product: Product }>('/admin/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
}

export async function adminUpdateProduct(id: string, updates: Partial<Product>) {
  return request<{ success: boolean; product: Product }>(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function adminDeleteProduct(id: string) {
  return request<{ success: boolean; message: string }>(`/admin/products/${id}`, {
    method: 'DELETE',
  });
}

export async function adminGetSettings() {
  const res = await request<{ settings: BusinessSettings }>('/admin/settings');
  return res.settings;
}

export async function adminUpdateSettings(updates: Partial<BusinessSettings>) {
  return request<{ success: boolean; settings: BusinessSettings }>('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// --------- CUSTOMER API ---------

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export async function customerRegister(payload: RegisterPayload) {
  const res = await request<{
    success: boolean;
    token: string;
    customer: { id: string; name: string; email: string; phone: string };
  }>('/customer/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.token) {
    localStorage.setItem('papis_customer_token', res.token);
  }
  return res;
}

export async function customerGetCaptcha() {
  return request<{ challenge: string; display: string }>('/customer/auth/captcha');
}

export async function customerLogin(email: string, password: string, captchaChallenge: string, captchaAnswer: string) {
  const res = await request<{
    success: boolean;
    token: string;
    customer: { id: string; name: string; email: string; phone: string };
  }>('/customer/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, captchaChallenge, captchaAnswer }),
  });
  if (res.token) {
    localStorage.setItem('papis_customer_token', res.token);
  }
  return res;
}

export async function customerLogout() {
  try {
    await request('/customer/auth/logout', { method: 'POST' });
  } finally {
    localStorage.removeItem('papis_customer_token');
  }
}

export async function customerGetMe() {
  return request<{ customer: { id: string; name: string; email: string; phone: string; isEmailVerified: boolean } }>(
    '/customer/auth/me'
  );
}

export async function customerUpdateProfile(name?: string, phone?: string) {
  return request<{
    success: boolean;
    customer: { id: string; name: string; email: string; phone: string };
  }>('/customer/profile', {
    method: 'PUT',
    body: JSON.stringify({ name, phone }),
  });
}

export async function customerChangePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
  return request<{ success: boolean; message: string }>('/customer/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
}

export async function customerGetOrders(params?: { page?: number; limit?: number; status?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.status && params.status !== 'All') query.append('status', params.status);

  const q = query.toString();
  return request<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/customer/orders${q ? `?${q}` : ''}`);
}

export async function customerGetOrder(id: string) {
  const res = await request<{ order: Order }>(`/customer/orders/${id}`);
  return res.order;
}

export async function validateCoupon(code: string, subtotal: number) {
  return request<{ success: boolean; discount: number; code: string }>('/customer/validate-coupon', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal }),
  });
}

export async function getAvailableCoupons() {
  return request<{ coupons: any[] }>('/customer/coupons');
}

// --------- PAYMENT API ---------

export interface CreatePaymentOrderPayload {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerPhone: string;
  customerId?: string;
}

export async function createPaymentOrder(payload: CreatePaymentOrderPayload) {
  return request<{
    success: boolean;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
    error?: string;
  }>('/payment/create-order', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export async function verifyPayment(payload: VerifyPaymentPayload) {
  return request<{
    success: boolean;
    message: string;
    orderId?: string;
    error?: string;
  }>('/payment/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPaymentStatus(orderId: string) {
  return request<{
    success: boolean;
    status: string;
    razorpayPaymentId?: string;
    error?: string;
  }>(`/payment/status/${orderId}`);
}
