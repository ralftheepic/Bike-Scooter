// backend/config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // Production-specific options:
      maxPoolSize: 10, // Adjust based on your expected concurrency
      connectTimeoutMS: 10000, // Increase timeout if necessary
      socketTimeoutMS: 45000, // Increase socket timeout
      // autoIndex: false, // Consider disabling auto-indexing in production for performance
      // ... other options as needed
    });

    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

export default connectDB;