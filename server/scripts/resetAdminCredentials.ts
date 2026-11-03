/**
 * Script to reset admin credentials to the values in .env
 * Usage: tsx server/scripts/resetAdminCredentials.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AdminModel } from '../models/Admin.js';

async function resetAdminCredentials() {
  const mongoUri = process.env.MONGODB_URI;
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!';

  console.log('🔐 Admin Credentials Reset Script');
  console.log('================================\n');

  // Connect to MongoDB if available
  if (mongoUri && mongoUri.trim() !== '') {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(mongoUri, {
        dbName: process.env.DATABASE_NAME || 'papi',
        serverSelectionTimeoutMS: 10000,
      });
      console.log('✅ Connected to MongoDB\n');

      // Hash the new password
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      // Find and update or create admin
      const admin = await AdminModel.findOneAndUpdate(
        { normalizedUsername: adminUsername.toLowerCase() },
        {
          username: adminUsername,
          normalizedUsername: adminUsername.toLowerCase(),
          passwordHash,
          role: 'admin',
        },
        { upsert: true, new: true }
      );

      console.log('✅ Admin credentials updated successfully!\n');
      console.log('Admin Details:');
      console.log(`  Username: ${admin.username}`);
      console.log(`  Role: ${admin.role}`);
      console.log(`  Password Hash: ${admin.passwordHash.substring(0, 20)}...`);
      console.log(`  Created/Updated: ${admin.updatedAt}\n`);

      console.log('🎉 You can now log in with:');
      console.log(`  Username: ${adminUsername}`);
      console.log(`  Password: ${adminPassword}\n`);

      await mongoose.disconnect();
      process.exit(0);
    } catch (err: any) {
      console.error('❌ MongoDB error:', err.message);
      console.log('\n⚠️  MongoDB not available. Using file-based store instead.\n');

      // Fall back to file-based store
      await resetAdminInFileStore(adminUsername, adminPassword);
      process.exit(0);
    }
  } else {
    console.log('⚠️  MONGODB_URI not configured. Using file-based store.\n');
    await resetAdminInFileStore(adminUsername, adminPassword);
    process.exit(0);
  }
}

async function resetAdminInFileStore(username: string, password: string) {
  try {
    const { localStore, saveLocalStore } = await import('../db.js');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Find existing admin and update, or create new
    const existingAdminIndex = localStore.admins.findIndex(
      (a: any) => a.username.toLowerCase() === username.toLowerCase()
    );

    const now = new Date().toISOString();

    if (existingAdminIndex >= 0) {
      localStore.admins[existingAdminIndex] = {
        ...localStore.admins[existingAdminIndex],
        username,
        passwordHash,
        updatedAt: now,
      };
      console.log('✅ Admin credentials updated in file store!\n');
    } else {
      const newAdmin = {
        id: require('crypto').randomUUID(),
        username,
        passwordHash,
        role: 'admin' as const,
        createdAt: now,
        updatedAt: now,
      };
      localStore.admins.push(newAdmin);
      console.log('✅ New admin created in file store!\n');
    }

    saveLocalStore();

    console.log('Admin Details:');
    console.log(`  Username: ${username}`);
    console.log(`  Role: admin`);
    console.log(`  Storage: File-based (.data/papis_kitchen.json)\n`);

    console.log('🎉 You can now log in with:');
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}\n`);
  } catch (err: any) {
    console.error('❌ Error resetting admin in file store:', err.message);
    process.exit(1);
  }
}

resetAdminCredentials().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
