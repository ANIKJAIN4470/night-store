/**
 * Quick script to update MongoDB settings directly
 * Run with: npx tsx server/updateSettings.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { SettingsModel } from './models/Settings.js';

dotenv.config();

async function updateSettings() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Update settings with new values
    const settings = await SettingsModel.findOneAndUpdate(
      {}, // Match any document
      {
        $set: {
          businessName: "Papi's Kitchen",
          tagline: 'Hot & Fresh Snacks, Delivered to Your Hostel Room!',
          contactPhone: '6375157243',
          whatsappPhone: '6375157243',
          openingTime: '21:00',
          closingTime: '05:00',
          isOpen: true,
          deliveryFee: 15,
          minOrderAmount: 50,
          estimatedDeliveryTime: '15-20 mins',
          acceptedHostels: [
            'Tagore Bhawan - C (Block A)',
            'Tagore Bhawan - C (Block B)',
            'Tagore Bhawan - C (Block C)'
          ],
          announcement: '🔥 Hot & fresh snacks delivered right to your room! Call/WhatsApp 6375157243 | Kitchen Hours: 9 PM - 5 AM IST',
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true, new: true } // Create if doesn't exist, return updated doc
    );

    console.log('\n✅ Settings updated successfully!');
    console.log('\nNew Settings:');
    console.log(`- Hostels: ${settings.acceptedHostels.join(', ')}`);
    console.log(`- Hours: ${settings.openingTime} - ${settings.closingTime} IST`);
    console.log(`- Contact: ${settings.contactPhone}`);
    console.log(`- WhatsApp: ${settings.whatsappPhone}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Done! Refresh your browser to see changes.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

updateSettings();
