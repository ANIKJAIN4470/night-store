/**
 * Script to replace all products with new snack items
 * Run with: npx tsx server/updateProducts.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { ProductModel } from './models/Product.js';

dotenv.config();

// Helper function to generate slug from name
function generateSlug(name: string, weight: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${weight.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
}

// New snack products with multiple sizes
const newProducts = [
  // 1. Kurkure Masala Munch
  {
    name: 'Kurkure Masala Munch',
    category: 'Snacks',
    price: 20,
    weight: '20g',
    description: 'Crispy corn & rice snacks with masala flavor',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Kurkure+Masala+Munch',
    isVeg: true
  },
  {
    name: 'Kurkure Masala Munch',
    category: 'Snacks',
    price: 40,
    weight: '45g',
    description: 'Crispy corn & rice snacks with masala flavor',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Kurkure+Masala+Munch',
    isVeg: true
  },

  // 2. Kurkure Green Chutney Style
  {
    name: 'Kurkure Green Chutney Style',
    category: 'Snacks',
    price: 20,
    weight: '20g',
    description: 'Green chutney flavored corn & rice snacks',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Kurkure+Green+Chutney',
    isVeg: true
  },
  {
    name: 'Kurkure Green Chutney Style',
    category: 'Snacks',
    price: 40,
    weight: '45g',
    description: 'Green chutney flavored corn & rice snacks',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Kurkure+Green+Chutney',
    isVeg: true
  },

  // 3. Kurkure Chilli Chatka
  {
    name: 'Kurkure Chilli Chatka',
    category: 'Snacks',
    price: 20,
    weight: '20g',
    description: 'Spicy chilli flavored corn & rice sticks',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Kurkure+Chilli+Chatka',
    isVeg: true
  },
  {
    name: 'Kurkure Chilli Chatka',
    category: 'Snacks',
    price: 40,
    weight: '45g',
    description: 'Spicy chilli flavored corn & rice sticks',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Kurkure+Chilli+Chatka',
    isVeg: true
  },

  // 4. Bingo Tedhe Medhe Masala Tadka
  {
    name: 'Bingo Tedhe Medhe - Masala Tadka',
    category: 'Snacks',
    price: 20,
    weight: '20g',
    description: 'Twisted snacks with masala tadka flavor',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Bingo+Tedhe+Medhe',
    isVeg: true
  },
  {
    name: 'Bingo Tedhe Medhe - Masala Tadka',
    category: 'Snacks',
    price: 40,
    weight: '45g',
    description: 'Twisted snacks with masala tadka flavor',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Bingo+Tedhe+Medhe',
    isVeg: true
  },

  // 5. Balaji Wafers Simply Salted
  {
    name: 'Balaji Wafers Simply Salted',
    category: 'Wafers',
    price: 25,
    weight: '25g',
    description: 'Classic simply salted potato wafers',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Balaji+Simply+Salted',
    isVeg: true
  },
  {
    name: 'Balaji Wafers Simply Salted',
    category: 'Wafers',
    price: 50,
    weight: '50g',
    description: 'Classic simply salted potato wafers',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Balaji+Simply+Salted',
    isVeg: true
  },

  // 6. Balaji Wafers Cream & Onion
  {
    name: 'Balaji Wafers Cream & Onion',
    category: 'Wafers',
    price: 25,
    weight: '25g',
    description: 'Creamy onion flavored potato wafers',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Balaji+Cream+Onion',
    isVeg: true
  },
  {
    name: 'Balaji Wafers Cream & Onion',
    category: 'Wafers',
    price: 50,
    weight: '50g',
    description: 'Creamy onion flavored potato wafers',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Balaji+Cream+Onion',
    isVeg: true
  },

  // 7. Balaji Crunchem Tomato Twist
  {
    name: 'Balaji Crunchem Tomato Twist',
    category: 'Wafers',
    price: 30,
    weight: '25g',
    description: 'Tomato twist flavored crunchy wafers',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Balaji+Tomato+Twist',
    isVeg: true
  },
  {
    name: 'Balaji Crunchem Tomato Twist',
    category: 'Wafers',
    price: 60,
    weight: '55g',
    description: 'Tomato twist flavored crunchy wafers',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Balaji+Tomato+Twist',
    isVeg: true
  },

  // 8. Balaji Crunchem Masala Masti
  {
    name: 'Balaji Crunchem Masala Masti',
    category: 'Wafers',
    price: 30,
    weight: '25g',
    description: 'Masala masti flavored crunchy wafers',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Balaji+Masala+Masti',
    isVeg: true
  },
  {
    name: 'Balaji Crunchem Masala Masti',
    category: 'Wafers',
    price: 60,
    weight: '55g',
    description: 'Masala masti flavored crunchy wafers',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Balaji+Masala+Masti',
    isVeg: true
  },

  // 9. Balaji Crunchem Peri Peri
  {
    name: 'Balaji Crunchem Peri Peri',
    category: 'Wafers',
    price: 30,
    weight: '25g',
    description: 'Spicy peri peri flavored crunchy wafers',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Balaji+Peri+Peri',
    isVeg: true
  },
  {
    name: 'Balaji Crunchem Peri Peri',
    category: 'Wafers',
    price: 60,
    weight: '55g',
    description: 'Spicy peri peri flavored crunchy wafers',
    available: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Balaji+Peri+Peri',
    isVeg: true
  }
];

async function updateProducts() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Step 1: Delete all existing products
    console.log('\n📭 Deleting all existing products...');
    const deleteResult = await ProductModel.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} products`);

    // Step 2: Add slug to each product
    const productsWithSlugs = newProducts.map((p: any) => ({
      ...p,
      slug: generateSlug(p.name, p.weight)
    }));

    // Step 3: Insert new products
    console.log('\n📥 Adding new snack products...');
    const insertResult = await ProductModel.insertMany(productsWithSlugs);
    console.log(`✅ Added ${insertResult.length} new products`);

    // Step 4: Display summary
    console.log('\n📋 PRODUCT SUMMARY:');
    console.log('═'.repeat(70));
    
    const categories = [...new Set(newProducts.map(p => p.category))];
    for (const category of categories) {
      const categoryProducts = newProducts.filter(p => p.category === category);
      const uniqueNames = [...new Set(categoryProducts.map(p => p.name))];
      console.log(`\n${category.toUpperCase()} (${uniqueNames.length} types, ${categoryProducts.length} variants):`);
      
      uniqueNames.forEach(name => {
        const variants = categoryProducts.filter(p => p.name === name);
        console.log(`  • ${name}`);
        variants.forEach(v => {
          console.log(`    - ${v.weight.padEnd(8)} @ ₹${String(v.price).padEnd(3)}`);
        });
      });
    }

    console.log('\n' + '═'.repeat(70));
    console.log('\n✅ All products updated successfully!');
    console.log('🔄 Refresh your browser to see the new menu');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

updateProducts();
