const mongoose = require('mongoose');

let isDbConnected = false;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isDbConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    isDbConnected = false;
    console.error('❌ CRITICAL: MongoDB connection failed:', error.message);
  }
};

const getDbStatus = () => isDbConnected;

module.exports = { connectDB, getDbStatus };



