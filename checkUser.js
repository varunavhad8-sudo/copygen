require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const email = 'varunavhad8@gmail.com';
    const users = await User.find({ email: new RegExp(email, 'i') });
    console.log(`Found ${users.length} users with email ${email}:`);
    users.forEach(u => {
      console.log(`- ID: ${u._id}, UID: ${u.firebaseUid}, Email: ${u.email}, Plan: ${u.plan}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err.message);
    process.exit(1);
  }
};

checkUser();
