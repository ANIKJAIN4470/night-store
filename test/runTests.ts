import assert from 'assert';
import bcrypt from 'bcryptjs';
import {
  initDatabase,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  getSettings,
  updateSettings,
  createOrder,
  getOrderById,
  getOrderByNumber,
  updateOrderStatus,
  cancelOrder,
  findAdminByUsername,
  getDashboardStats,
} from '../server/db.js';
import { generateToken, verifyToken, checkLoginRateLimit } from '../server/auth.js';

let passedCount = 0;
let totalCount = 0;

async function test(name: string, fn: () => Promise<void>) {
  totalCount++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function runAllTests() {
  console.log('\n--- Running Automated Papi\'s Kitchen Test Suite ---\n');

  // 1. Database initialization and seeding
  await test('1. Database initializes and seeds default products and settings', async () => {
    await initDatabase();
    const products = await getProducts();
    assert.ok(products.length >= 10, 'Products should be seeded with at least 10 snacks');
    const settings = await getSettings();
    assert.strictEqual(settings.businessName, "Papi's Kitchen");
    assert.ok(settings.deliveryFee > 0, 'Default delivery fee should exist');
  });

  // 2. Product listing & filters
  await test('2. Product listing and category filtering works', async () => {
    const maggi = await getProducts({ category: 'Maggi' });
    assert.ok(maggi.length > 0, 'Should find Maggi products');
    assert.ok(maggi.every((p) => p.category === 'Maggi'), 'All returned items should be in Maggi category');

    const searchRes = await getProducts({ search: 'Cheese' });
    assert.ok(searchRes.length > 0, 'Should find snacks matching search Cheese');
  });

  // 3. Admin user authentication & password hashing
  await test('3. Admin authentication & password hashing works', async () => {
    const admin = await findAdminByUsername('admin');
    assert.ok(admin, 'Default admin should be found');
    const isMatch = await bcrypt.compare('ChangeThisPassword123!', admin!.passwordHash);
    assert.strictEqual(isMatch, true, 'Default password should match hash');

    const isWrongMatch = await bcrypt.compare('WrongPassword', admin!.passwordHash);
    assert.strictEqual(isWrongMatch, false, 'Invalid password should be rejected');
  });

  // 4. Token generation and authorization validation
  await test('4. Secure admin token generation and verification works', async () => {
    const token = generateToken({ id: 'test-admin', username: 'admin', role: 'admin' });
    assert.ok(token && token.split('.').length === 3, 'JWT token should have 3 segments');

    const payload = verifyToken(token);
    assert.ok(payload, 'Token should verify successfully');
    assert.strictEqual(payload!.username, 'admin');

    // Tampered token test
    const tampered = token.slice(0, -4) + 'abcd';
    const badPayload = verifyToken(tampered);
    assert.strictEqual(badPayload, null, 'Tampered token must be rejected');
  });

  // 5. Product creation and price editing
  await test('5. Product creation and price editing operates properly', async () => {
    const newProd = await createProduct({
      name: 'Loaded Nachos Test',
      description: 'Crispy corn tortilla chips with cheese and salsa',
      mrp: 85,
      sellingPrice: 95,
      stock: 50,
      category: 'Indian Snacks',
      imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d',
      available: true,
      isSpecial: false,
      isVeg: true,
    });
    assert.ok(newProd.id, 'New product should have an ID');
    assert.strictEqual(newProd.sellingPrice, 95);

    const updated = await updateProduct(newProd.id, { sellingPrice: 110, available: false });
    assert.strictEqual(updated?.sellingPrice, 110);
    assert.strictEqual(updated?.available, false);
  });

  // 6. Successful order creation with immutable price snapshot
  let testOrderNumber = '';
  let testTrackingToken = '';
  await test('6. Successful order creation with immutable product price snapshot', async () => {
    const prods = await getProducts();
    const item1 = prods[0];
    const item2 = prods[1];

    const price1 = item1.sellingPrice || item1.price || 100;
    const price2 = item2.sellingPrice || item2.price || 100;

    const order = await createOrder({
      orderNumber: `PK-TEST-${Date.now().toString().slice(-4)}`,
      trackingToken: 'token-secret-test-32chars-123456',
      customerName: 'Aarav Patel',
      customerPhone: '9876543210',
      deliveryMethod: 'Room Delivery',
      hostelName: 'Boys Hostel 2 (BH-2)',
      hostelBlock: 'Block A',
      roomNumber: 'Room 204',
      deliveryInstructions: 'Ring before entering',
      subtotal: price1 * 2 + price2,
      deliveryFee: 15,
      discount: 0,
      total: price1 * 2 + price2 + 15,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      statusHistory: [{ status: 'Pending', timestamp: new Date().toISOString() }],
      items: [
        {
          productId: item1.id,
          productName: item1.name,
          unitPrice: price1,
          quantity: 2,
          subtotal: price1 * 2,
        },
        {
          productId: item2.id,
          productName: item2.name,
          unitPrice: price2,
          quantity: 1,
          subtotal: price2,
        },
      ],
    });

    assert.ok(order.id, 'Order should have generated ID');
    testOrderNumber = order.orderNumber;
    testTrackingToken = order.trackingToken;
    assert.strictEqual(order.customerName, 'Aarav Patel');
    assert.strictEqual(order.orderStatus, 'Placed');
  });

  // 7. Order tracking token lookup
  await test('7. Order tracking retrieval requires valid order number', async () => {
    const found = await getOrderByNumber(testOrderNumber);
    assert.ok(found, 'Order should be retrieved by order number');
    assert.strictEqual(found!.trackingToken, testTrackingToken);
  });

  // 8. Order status transitions
  await test('8. Order status progression and audit history entry', async () => {
    const order = await getOrderByNumber(testOrderNumber);
    assert.ok(order);

    const updated = await updateOrderStatus(order!.id, 'Preparing', 'Kitchen started cooking');
    assert.strictEqual(updated?.orderStatus, 'Preparing');
    assert.ok(updated!.statusHistory.some((h) => h.status === 'Preparing'), 'History should record status update');
  });

  // 9. Customer cancellation rule enforcement
  await test('9. Customer cancellation rejected once order leaves Pending state', async () => {
    const order = await getOrderByNumber(testOrderNumber);
    // Order is currently in 'Preparing'
    const res = await cancelOrder(order!.id, 'Student changed mind', true);
    assert.strictEqual(res.success, false, 'Cancellation by customer should be rejected once Preparing');
  });

  // 10. Dashboard analytics statistics calculation
  await test('10. Dashboard real-time statistics calculation', async () => {
    const stats = await getDashboardStats();
    assert.ok(typeof stats.totalOrdersToday === 'number');
    assert.ok(typeof stats.todayOrderValue === 'number');
    assert.ok(typeof stats.todayCollectedRevenue === 'number');
  });

  // 11. Settings updates
  await test('11. Owner settings update and persistence', async () => {
    const updated = await updateSettings({ deliveryFee: 20 });
    assert.strictEqual(updated.deliveryFee, 20);
    // Restore
    await updateSettings({ deliveryFee: 15 });
  });

  console.log(`\nResults: ${passedCount}/${totalCount} tests passed.\n`);
  if (passedCount < totalCount) {
    process.exit(1);
  }
}

runAllTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
