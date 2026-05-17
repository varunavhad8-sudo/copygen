const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Configure dotenv to point to the .env file in the root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Client = require('../models/Client');
const Output = require('../models/Output');
const Brief = require('../models/Brief');
const BrandProfile = require('../models/BrandProfile');

async function run() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // ── STEP 1: Find all duplicate users (same email) ─────────────
    const allUsers = await User.find({}).sort({ createdAt: 1 });

    // Group by normalized email
    const emailMap = {};
    for (const user of allUsers) {
      if (!user.email) continue;
      const email = user.email.toLowerCase().trim();
      if (!emailMap[email]) emailMap[email] = [];
      emailMap[email].push(user);
    }

    // Find emails that have more than one User document
    const duplicates = Object.entries(emailMap).filter(
      ([email, users]) => users.length > 1
    );

    console.log(`Found ${duplicates.length} email(s) with duplicate accounts`);

    // ── STEP 2: For each duplicate group, merge into one ──────────
    for (const [email, users] of duplicates) {
      console.log(`\nProcessing: ${email} (${users.length} accounts found)`);

      // The REAL user = the one with the most data linked to it
      let realUser = null;
      let maxData = -1;

      for (const user of users) {
        const clientCount = await Client.countDocuments({ userId: user._id });
        const outputCount = await Output.countDocuments({ userId: user._id });
        const total = clientCount + outputCount;
        console.log(
          `  User _id: ${user._id} | firebaseUid: ${user.firebaseUid} | ` +
          `clients: ${clientCount} | outputs: ${outputCount}`
        );
        if (total > maxData) {
          maxData = total;
          realUser = user;
        }
      }

      // If tied or no data, keep the oldest one (already sorted by createdAt)
      if (!realUser) realUser = users[0];

      // The duplicates = everyone except the real user
      const duplicateUsers = users.filter(
        u => u._id.toString() !== realUser._id.toString()
      );

      console.log(`  → Keeping User _id: ${realUser._id}`);
      console.log(`  → Deleting ${duplicateUsers.length} duplicate(s)`);

      for (const dupUser of duplicateUsers) {
        // Re-point all data from duplicate _id to real _id
        const clientsMoved = await Client.updateMany(
          { userId: dupUser._id },
          { $set: { userId: realUser._id } }
        );
        const outputsMoved = await Output.updateMany(
          { userId: dupUser._id },
          { $set: { userId: realUser._id } }
        );
        const briefsMoved = await Brief.updateMany(
          { userId: dupUser._id },
          { $set: { userId: realUser._id } }
        );
        const brandsMoved = await BrandProfile.updateMany(
          { userId: dupUser._id },
          { $set: { userId: realUser._id } }
        );

        console.log(`  Moved from ${dupUser._id}:`);
        console.log(`    clients: ${clientsMoved.modifiedCount}`);
        console.log(`    outputs: ${outputsMoved.modifiedCount}`);
        console.log(`    briefs:  ${briefsMoved.modifiedCount}`);
        console.log(`    brands:  ${brandsMoved.modifiedCount}`);

        // Delete the duplicate user document
        await User.deleteOne({ _id: dupUser._id });
        console.log(`  Deleted duplicate User: ${dupUser._id}`);
      }

      // Normalize the real user's email to lowercase and ensure firebaseUid is kept
      await User.updateOne(
        { _id: realUser._id },
        { $set: { email: email } }
      );
      console.log(`  Normalized email to lowercase on real user`);
    }

    // ── STEP 3: Ensure unique index on firebaseUid ────────────────
    console.log('\nEnsuring unique index on firebaseUid...');
    try {
      await User.collection.createIndex(
        { firebaseUid: 1 },
        { unique: true, sparse: true }
      );
      console.log('Index created or already exists');
    } catch (err) {
      console.log('Index note:', err.message);
    }

    // ── STEP 4: Ensure unique index on email ─────────────────────
    console.log('Ensuring unique index on email...');
    try {
      await User.collection.createIndex(
        { email: 1 },
        { unique: true, sparse: true }
      );
      console.log('Index created or already exists');
    } catch (err) {
      console.log('Index note:', err.message);
    }

    // ── STEP 5: Final verification report ────────────────────────
    console.log('\n=== FINAL REPORT ===');
    const finalUsers = await User.find({}).sort({ createdAt: 1 });
    for (const u of finalUsers) {
      const clients = await Client.countDocuments({ userId: u._id });
      const outputs = await Output.countDocuments({ userId: u._id });
      console.log(
        `User: ${u.email} | plan: ${u.plan} | ` +
        `clients: ${clients} | outputs: ${outputs} | ` +
        `firebaseUid: ${u.firebaseUid}`
      );
    }

    console.log('\nCleanup complete. Safe to delete this script.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
