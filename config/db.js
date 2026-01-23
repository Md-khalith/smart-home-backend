const mongoose = require('mongoose');

// MODIFIED: explicit options for Railway + Atlas stability
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    console.log(`🌿 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    throw error; // MODIFIED: let server.js decide to exit
  }
};

module.exports = connectDB;
