const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('CRITICAL: MongoDB connection failed:', error.message);
    // process.exit(1); // Keep server alive for debugging
  }
};

module.exports = connectDB;



