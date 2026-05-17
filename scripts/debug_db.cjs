const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Client = require('../models/Client');
const Output = require('../models/Output');
const BrandProfile = require('../models/BrandProfile');

async function debugDB() {
  try {
    console.log('Connecting to:', process.env.MONGODB_URI?.split('@')[1] || 'URI MISSING');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to DB');

    const userCount = await User.countDocuments();
    const clientCount = await Client.countDocuments();
    const outputCount = await Output.countDocuments();
    const brandCount = await BrandProfile.countDocuments();

    console.log('\n--- DB Global Stats ---');
    console.log('Total Users:', userCount);
    console.log('Total Clients:', clientCount);
    console.log('Total Outputs:', outputCount);
    console.log('Total Brand Voices:', brandCount);

    const users = await User.find().sort({ createdAt: -1 }).limit(3);
    console.log('\n--- Recent Users ---');
    users.forEach(u => console.log(`ID: ${u._id}, Email: ${u.email}, FirebaseUID: ${u.firebaseUid?.substring(0,10)}...`));

    if (users.length > 0) {
      const latestUser = users[0];
      console.log(`\n--- Data for Latest User (${latestUser.email}) ---`);
      
      const userClients = await Client.find({ userId: latestUser._id });
      console.log('Clients count:', userClients.length);
      userClients.forEach(c => console.log(`  - ${c.name} (${c._id})`));

      const userOutputs = await Output.find({ userId: latestUser._id });
      console.log('Outputs count:', userOutputs.length);
      
      const userBrands = await BrandProfile.find({ userId: latestUser._id });
      console.log('Brand Voices count:', userBrands.length);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Debug failed:', err);
  }
}

debugDB();
