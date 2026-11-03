import mongoose from 'mongoose';
import { ProductModel } from './models/Product.js';
import { comprehensiveProducts } from './comprehensiveProductsInventory.js';

async function seedComprehensiveInventory() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not set in environment');
    }

    await mongoose.connect(mongoUri, {
      dbName: process.env.DATABASE_NAME || 'papi',
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing products
    const deletedCount = await ProductModel.deleteMany({});
    console.log(`🗑️  Deleted ${deletedCount.deletedCount} existing products`);

    // Insert comprehensive products
    const result = await ProductModel.insertMany(
      comprehensiveProducts.map((p) => ({
        ...p,
        slug: p.slug || `${p.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      }))
    );

    console.log(`✅ Successfully seeded ${result.length} comprehensive products!`);
    console.log(`
    Products added by category:
    - Chips: 9 products
    - Wafers: 11 products (including Balaji Large)
    - Namkeen: 4 products
    - Instant Noodles: 5 products
    - Cookies & Biscuits: 7 products
    - Chocolates: 4 products
    - Candies: 2 products
    - Drinks: 3 products
    
    Total: ${result.length} products
    
    Pricing applied: MRP + ₹10 = Selling Price
    `);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedComprehensiveInventory();
