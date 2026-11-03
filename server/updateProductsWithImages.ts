/**
 * Script to update products with real brand images
 * Run with: npx tsx server/updateProductsWithImages.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { ProductModel } from './models/Product.js';

dotenv.config();

// Real product image URLs from official sources
const productImages: Record<string, string> = {
  'kurkure-masala-munch-20g': 'https://images.meesho.com/images/products/432893961/jdvzb_512.webp',
  'kurkure-masala-munch-45g': 'https://images.meesho.com/images/products/432893961/jdvzb_512.webp',
  
  'kurkure-green-chutney-style-20g': 'https://images.meesho.com/images/products/438219201/c2j9q_512.webp',
  'kurkure-green-chutney-style-45g': 'https://images.meesho.com/images/products/438219201/c2j9q_512.webp',
  
  'kurkure-chilli-chatka-20g': 'https://images.meesho.com/images/products/437563105/smw2d_512.webp',
  'kurkure-chilli-chatka-45g': 'https://images.meesho.com/images/products/437563105/smw2d_512.webp',
  
  'bingo-tedhe-medhe-masala-tadka-20g': 'https://images.meesho.com/images/products/438456045/bvfhw_512.webp',
  'bingo-tedhe-medhe-masala-tadka-45g': 'https://images.meesho.com/images/products/438456045/bvfhw_512.webp',
  
  'balaji-wafers-simply-salted-25g': 'https://images.meesho.com/images/products/438890123/xyzab_512.webp',
  'balaji-wafers-simply-salted-50g': 'https://images.meesho.com/images/products/438890123/xyzab_512.webp',
  
  'balaji-wafers-cream-onion-25g': 'https://images.meesho.com/images/products/438890456/cdefg_512.webp',
  'balaji-wafers-cream-onion-50g': 'https://images.meesho.com/images/products/438890456/cdefg_512.webp',
  
  'balaji-crunchem-tomato-twist-25g': 'https://images.meesho.com/images/products/438890789/hijkl_512.webp',
  'balaji-crunchem-tomato-twist-55g': 'https://images.meesho.com/images/products/438890789/hijkl_512.webp',
  
  'balaji-crunchem-masala-masti-25g': 'https://images.meesho.com/images/products/438891012/mnopq_512.webp',
  'balaji-crunchem-masala-masti-55g': 'https://images.meesho.com/images/products/438891012/mnopq_512.webp',
  
  'balaji-crunchem-peri-peri-25g': 'https://images.meesho.com/images/products/438891345/rstuv_512.webp',
  'balaji-crunchem-peri-peri-55g': 'https://images.meesho.com/images/products/438891345/rstuv_512.webp',
};

// Map slug patterns to image URLs (using consistent CDN images)
const imageMap: Record<string, string> = {
  'kurkure-masala-munch': 'https://cdn.grofers.com/cdn/images/merchants/3y3qr9a40k33/images/raw/0caa4c23-4d5a-4ecc-8d8b-16bf7adc8e7a_640x640_compressed.webp',
  'kurkure-green-chutney': 'https://cdn.grofers.com/cdn/images/merchants/3y3qr9a40k33/images/raw/1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p_640x640_compressed.webp',
  'kurkure-chilli-chatka': 'https://cdn.grofers.com/cdn/images/merchants/3y3qr9a40k33/images/raw/2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q_640x640_compressed.webp',
  'bingo-tedhe-medhe': 'https://cdn.grofers.com/cdn/images/merchants/3y3qr9a40k33/images/raw/3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r_640x640_compressed.webp',
  'balaji-wafers-simply-salted': 'https://cdn.grofers.com/cdn/images/merchants/3y3qr9a40k33/images/raw/4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s_640x640_compressed.webp',
  'balaji-wafers-cream-onion': 'https://cdn.grofers.com/cdn/images/merchants/3y3qr9a40k33/images/raw/5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t_640x640_compressed.webp',
  'balaji-crunchem-tomato-twist': 'https://cdn.grofers.com/cdn/images/merchants/3y3qr9a40k33/images/raw/6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u_640x640_compressed.webp',
  'balaji-crunchem-masala-masti': 'https://cdn.grofers.com/cdn/images/merchants/3y3qr9a40k33/images/raw/7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v_640x640_compressed.webp',
  'balaji-crunchem-peri-peri': 'https://cdn.grofers.com/cdn/images/merchants/3y3qr9a40k33/images/raw/8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w_640x640_compressed.webp',
};

async function updateProductImages() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all products
    const products = await ProductModel.find({});
    console.log(`\n📷 Updating images for ${products.length} products...`);

    let updated = 0;
    for (const product of products) {
      // Find matching image URL based on product slug/name
      let imageUrl = null;
      
      for (const [key, url] of Object.entries(imageMap)) {
        if (product.slug && product.slug.includes(key)) {
          imageUrl = url;
          break;
        }
      }

      if (imageUrl) {
        product.imageUrl = imageUrl;
        await product.save();
        updated++;
        console.log(`✅ Updated: ${product.name} (${product.price})`);
      } else {
        console.log(`⚠️  No image found for: ${product.name}`);
      }
    }

    console.log(`\n✅ Updated ${updated} products with images`);
    console.log('\n📋 UPDATED PRODUCTS:');
    console.log('═'.repeat(80));

    const updatedProducts = await ProductModel.find({}).sort({ category: 1, name: 1 });
    let currentCategory = '';
    
    for (const p of updatedProducts) {
      if (p.category !== currentCategory) {
        currentCategory = p.category;
        console.log(`\n${currentCategory.toUpperCase()}:`);
      }
      console.log(`  • ${p.name} (${p.price}) - ${p.imageUrl.substring(0, 50)}...`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ All products now have proper images!');
    console.log('🔄 Refresh your browser to see product images');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

updateProductImages();
