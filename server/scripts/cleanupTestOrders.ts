/**
 * Production-safe test-order cleanup.
 *
 * This deliberately refuses to delete anything unless every existing order is
 * positively identified as test data. That makes it safe to run before launch
 * while preventing accidental removal of genuine customer financial records.
 */
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { initDatabase, getDatabaseStatus, localStore, saveLocalStore } from '../db.js';
import { OrderModel } from '../models/Order.js';
import { ProductModel } from '../models/Product.js';
import { CustomerModel } from '../models/Customer.js';

const isTestOrder = (order: any) => {
  const text = [order.orderNumber, order.customerName, order.customerPhone, order.trackingToken]
    .filter(Boolean).join(' ').toLowerCase();
  return /\b(test|demo|dummy|sample|qa|automation)\b/.test(text) || /^pk-test-/i.test(order.orderNumber || '');
};

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function run() {
  await initDatabase();
  const status = getDatabaseStatus();
  const backupDir = path.resolve(process.cwd(), '.data', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const allOrdersConfirmedTest = process.argv.includes('--confirmed-all-test-orders');

  if (status.isMongoConnected) {
    const orders = await OrderModel.find().lean();
    if (!allOrdersConfirmedTest && !orders.every(isTestOrder)) {
      throw new Error('Cleanup aborted: at least one order is not conclusively identified as test data. No records were changed.');
    }
    const productsBefore = await ProductModel.find().lean();
    const orderIds = orders.map((order: any) => order._id.toString());
    const customerTransactions = await CustomerModel.find({ 'rewardTransactions.orderId': { $in: orderIds } }).select('_id rewardTransactions').lean();
    fs.writeFileSync(path.join(backupDir, `mongo-order-cleanup-${stamp}.json`), JSON.stringify({ orders, customerTransactions }, null, 2));
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await OrderModel.deleteMany({}, { session });
        await CustomerModel.updateMany(
          { 'rewardTransactions.orderId': { $in: orderIds } },
          { $pull: { rewardTransactions: { orderId: { $in: orderIds } } } },
          { session }
        );
        if (await OrderModel.countDocuments({}, { session }) !== 0) throw new Error('Verification failed: orders remain after cleanup.');
        const productsAfter = await ProductModel.find().lean().session(session);
        if (JSON.stringify(productsBefore) !== JSON.stringify(productsAfter)) throw new Error('Verification failed: product data changed.');
      });
    } finally { await session.endSession(); }
    console.log(`Removed ${orders.length} confirmed test orders. Backup: .data/backups/mongo-order-cleanup-${stamp}.json`);
    return;
  }

  const orders = localStore.orders || [];
  if (!allOrdersConfirmedTest && !orders.every(isTestOrder)) {
    throw new Error('Cleanup aborted: at least one order is not conclusively identified as test data. No records were changed.');
  }
  const productsBefore = JSON.stringify(localStore.products);
  fs.writeFileSync(path.join(backupDir, `local-store-${stamp}.json`), JSON.stringify(localStore, null, 2));
  localStore.orders = [];
  if (JSON.stringify(localStore.products) !== productsBefore) throw new Error('Verification failed: product data changed.');
  saveLocalStore();
  console.log(`Removed ${orders.length} verified test orders. Backup: .data/backups/local-store-${stamp}.json`);
}

run().then(() => process.exit(0)).catch((error) => { console.error(error.message); process.exit(1); });
