/**
 * Comprehensive Snacks Inventory for Hostel Food Pack
 * Organized by brand, flavor, and price point
 * Run with: npx tsx server/updateSnacksInventory.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { ProductModel } from './models/Product.js';

dotenv.config();

// Helper to generate unique slug
function generateSlug(name: string, flavor: string, price: number): string {
  const base = `${name}-${flavor}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${base}-${price}`;
}

// Comprehensive snacks inventory
const snacksInventory = [
  // ========== KURKURE ₹20 PACKETS (20g) ==========
  {
    name: 'Kurkure Masala Munch',
    flavor: 'Masala Munch',
    brand: 'Kurkure',
    category: 'Snacks - ₹20',
    price: 20,
    weight: '20g',
    description: 'Crispy corn & rice snacks with spicy masala flavor',
    available: true,
    imageUrl: 'https://m.media-amazon.com/images/I/71jfIVfj3sL._SX679_.jpg',
    isVeg: true
  },
  {
    name: 'Kurkure Chilli Chatka',
    flavor: 'Chilli Chatka',
    brand: 'Kurkure',
    category: 'Snacks - ₹20',
    price: 20,
    weight: '20g',
    description: 'Spicy chilli flavored corn & rice sticks',
    available: true,
    imageUrl: 'https://m.media-amazon.com/images/I/71v8L6vHoOL._SX679_.jpg',
    isVeg: true
  },
  {
    name: 'Kurkure Green Chutney',
    flavor: 'Green Chutney',
    brand: 'Kurkure',
    category: 'Snacks - ₹20',
    price: 20,
    weight: '20g',
    description: 'Tangy green chutney flavored corn & rice snacks',
    available: true,
    imageUrl: 'https://m.media-amazon.com/images/I/71+p-mcZ5IL._SX679_.jpg',
    isVeg: true
  },

  // ========== BALAJI WAFERS ₹10 PACKETS (various sizes) ==========
  {
    name: 'Balaji Wafers Peri Peri',
    flavor: 'Peri Peri',
    brand: 'Balaji',
    category: 'Wafers - ₹10',
    price: 10,
    weight: '15g',
    description: 'Spicy peri peri flavored potato wafers',
    available: true,
    imageUrl: 'https://m.media-amazon.com/images/I/71d5Y+v8voL._SX679_.jpg',
    isVeg: true
  },
  {
    name: 'Balaji Wafers Cream & Onion',
    flavor: 'Cream & Onion',
    brand: 'Balaji',
    category: 'Wafers - ₹10',
    price: 10,
    weight: '15g',
    description: 'Creamy onion flavored potato wafers',
    available: true,
    imageUrl: 'https://m.media-amazon.com/images/I/71VNB0XqLiL._SX679_.jpg',
    isVeg: true
  },
  {
    name: 'Balaji Wafers Tomato',
    flavor: 'Tomato',
    brand: 'Balaji',
    category: 'Wafers - ₹10',
    price: 10,
    weight: '15g',
    description: 'Tangy tomato flavored potato wafers',
    available: true,
    imageUrl: 'https://m.media-amazon.com/images/I/71xrZ8jm2hL._SX679_.jpg',
    isVeg: true
  },
  {
    name: 'Balaji Wafers Masala Munch',
    flavor: 'Masala Munch',
    brand: 'Balaji',
    category: 'Wafers - ₹10',
    price: 10,
    weight: '15g',
    description: 'Spicy masala flavored potato wafers',
    available: true,
    imageUrl: 'https://m.media-amazon.com/images/I/71OjVcYqnZL._SX679_.jpg',
    isVeg: true
  },
  {
    name: 'Balaji Wafers Salt & Vinegar',
    flavor: 'Salt & Vinegar',
    brand: 'Balaji',
    category: 'Wafers - ₹10',
    price: 10,
    weight: '15g',
    description: 'Tangy salt & vinegar flavored potato wafers',
    available: true,
    imageUrl: 'https://m.media-amazon.com/images/I/71ZP8yJQlRL._SX679_.jpg',
    isVeg: true
  },
  {
    name: 'Balaji Wafers Simply Salted',
    flavor: 'Simply Salted',
    brand: 'Balaji',
    category: 'Wafers - ₹10',
    price: 10,
    weight: '15g',
    description: 'Classic simply salted potato wafers',
    available: true,
    imageUrl: 'https://m.media-amazon.com/images/I/71gT2MZ8M6L._SX679_.jpg',
    isVeg: true
  },

  // ========== BALAJI LARGE PACKETS ₹45 (55-60g) ==========
  {
    name: 'Balaji Crunchem Tomato Twist',
    flavor: 'Tomato Twist',
    brand: 'Balaji',
    category: 'Wafers - ₹45 Large',
    price: 45,
    weight: '55g',
    description: 'Crunchy wafers with tangy tomato twist flavor',
    available: true,
    imageUrl: 'https://m.media-amazon.com/images/I/71yJ5t6UYPL._SX679_.jpg',
    isVeg: true
  },
  {
    name: 'Balaji Crunchem Masala Masti',
    flavor: 'Masala Masti',
    brand: 'Balaji',
    category: 'Wafers - ₹45 Large',
    price: 45,
    weight: '55g',
    description: 'Crunchy wafers with spicy masala masti flavor',
    available: true,
    imageUrl: 'https://m.media-amazon.com/images/I/71DHfY0jjlL._SX679_.jpg',
    isVeg: true
  },
  {
    name: 'Balaji Crunchem Peri Peri',
    flavor: 'Peri Peri',
    brand: 'Balaji',
    category: 'Wafers - ₹45 Large',
    price: 45,
    weight: '55g',
    description: 'Crunchy wafers with spicy peri peri flavor',
    available: true,
    imageUrl: 'https://m.media-amazon.com/images/I/71RbD-H7hZL._SX679_.jpg',
    isVeg: true
  },
  {
    name: 'Balaji Crunchem Cream & Onion',
    flavor: 'Cream & Onion',
    brand: 'Balaji',
    category: 'Wafers - ₹45 Large',
    price: 45,
    weight: '55g',
    description: 'Crunchy wafers with creamy onion flavor',
    available: true,
    imageUrl: 'https://m.media-amazon.com/images/I/71YDXV0Z2NL._SX679_.jpg',
    isVeg: true
  },
  {
    name: 'Balaji Crunchem Salt & Vinegar',
    flavor: 'Salt & Vinegar',
    brand: 'Balaji',
    category: 'Wafers - ₹45 Large',
    price: 45,
    weight: '55g',
    description: 'Crunchy wafers with tangy salt & vinegar flavor',
    available: true,
    imageUrl: 'https://m.media-amazon.com/images/I/71k7Z2qJ0IL._SX679_.jpg',
    isVeg: true
  },
  {
    name: 'Balaji Crunchem Plain Salted',
    flavor: 'Plain Salted',
    brand: 'Balaji',
    category: 'Wafers - ₹45 Large',
    price: 45,
    weight: '55g',
    description: 'Crunchy wafers with plain salted flavor',
    available: true,
    imageUrl: 'https://m.media-amazon.com/images/I/71RjNrKl1tL._SX679_.jpg',
    isVeg: true
  },
];

async function updateSnacksInventory() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Step 1: Delete all existing products
    console.log('\n📭 Clearing existing inventory...');
    const deleteResult = await ProductModel.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} products`);

    // Step 2: Add slug to each product
    const productsWithSlugs = snacksInventory.map((p: any) => ({
      ...p,
      slug: generateSlug(p.name, p.flavor, p.price)
    }));

    // Step 3: Insert new products
    console.log('\n📥 Adding new snacks inventory...');
    const insertResult = await ProductModel.insertMany(productsWithSlugs);
    console.log(`✅ Added ${insertResult.length} products`);

    // Step 4: Display comprehensive summary
    console.log('\n📋 HOSTEL SNACKS INVENTORY:');
    console.log('═'.repeat(90));

    const categories = [
      'Snacks - ₹20',
      'Wafers - ₹10',
      'Wafers - ₹45 Large'
    ];

    for (const category of categories) {
      const categoryProducts = snacksInventory.filter(p => p.category === category);
      if (categoryProducts.length === 0) continue;

      console.log(`\n${category.toUpperCase()}`);
      console.log('─'.repeat(90));

      categoryProducts.forEach((p: any, idx: number) => {
        const brand = `[${p.brand}]`.padEnd(12);
        const flavor = p.flavor.padEnd(25);
        const weight = p.weight.padStart(6);
        const price = `₹${p.price}`.padStart(5);
        console.log(`  ${idx + 1}. ${brand} ${flavor} ${weight} ${price}`);
      });
    }

    // Step 5: Calculate statistics
    console.log('\n' + '═'.repeat(90));
    console.log('\n📊 INVENTORY STATISTICS:');
    console.log(`  • Total Products: ${snacksInventory.length}`);
    console.log(`  • Kurkure (₹20): ${snacksInventory.filter(p => p.price === 20).length} flavors`);
    console.log(`  • Balaji Wafers (₹10): ${snacksInventory.filter(p => p.price === 10).length} flavors`);
    console.log(`  • Balaji Large (₹45): ${snacksInventory.filter(p => p.price === 45).length} flavors`);
    console.log(`  • All products marked as Available: ✅`);
    console.log(`  • All products marked as Vegetarian: ✅`);
    console.log(`  • All products have images: ✅`);

    console.log('\n' + '═'.repeat(90));
    console.log('\n✅ Snacks inventory updated successfully!');
    console.log('🔄 Refresh your browser to see the complete menu');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

updateSnacksInventory();
