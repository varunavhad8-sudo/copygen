const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Set public DNS servers to resolve MongoDB SRV records properly on Windows
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  console.log('🌐 Configured public DNS servers (8.8.8.8, 1.1.1.1) for SRV resolution');
} catch (dnsErr) {
  console.warn('⚠️ Failed to set DNS servers, continuing with defaults:', dnsErr.message);
}

const mongoose = require('mongoose');
const User = require('../models/User');
const { PLAN_LIMITS } = require('../config/plans');
const { connectDB } = require('../config/db');

async function run() {
  try {
    // Connect to the database
    await connectDB();

    console.log('Fetching users to verify generation limits...');
    const users = await User.find({});
    console.log(`Found ${users.length} total users.\n`);

    let fixedCount = 0;

    for (const user of users) {
      const plan = user.plan || 'free';
      const correctLimit = PLAN_LIMITS[plan]?.generations;

      if (correctLimit === undefined) {
        console.warn(`⚠️ User ${user.email} has unknown plan: "${plan}". Skipping.`);
        continue;
      }

      if (user.generationsLimit !== correctLimit) {
        console.log(`[MISMATCH] Email: ${user.email} | Plan: ${plan} | Stored Limit: ${user.generationsLimit} | Correct Limit: ${correctLimit}`);
        
        user.generationsLimit = correctLimit;
        
        // Synchronize planLimits.maxGenerations if present
        if (user.planLimits) {
          user.planLimits.maxGenerations = correctLimit;
        }

        await user.save();
        fixedCount++;
      }
    }

    console.log(`\n🎉 Verification & Migration completed successfully.`);
    console.log(`📊 Total mismatches corrected/fixed: ${fixedCount} users.`);
  } catch (error) {
    console.error('❌ Migration failed with error:', error);
  } finally {
    // Clean up connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  }
}

run();
