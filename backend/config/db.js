// backend/config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    // Log the connection string being used (helpful for debugging)
    console.log('Attempting to connect to MongoDB with URI:', process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI, {
      // Include replicaSet option for local replica set connection
      replicaSet: 'rs0', // <-- Add this line for your local replica set

      // Other options you had:
      maxPoolSize: 10, // Adjust based on your expected concurrency
      connectTimeoutMS: 10000, // Increase timeout if necessary
      socketTimeoutMS: 45000, // Increase socket timeout
      // autoIndex: false, // Consider disabling auto-indexing in production for performance
      // ... other options as needed

      // These options are often recommended for modern Mongoose/drivers,
      // but might not be necessary for Mongoose v6+ as they are default
      useNewUrlParser: true, // Keep if using older Mongoose, harmless otherwise
      useUnifiedTopology: true, // Keep if using older Mongoose, harmless otherwise

      // Remove these options if they are present, as they are deprecated
      // useCreateIndex: true,
      // useFindAndModify: false,

    });

    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

export default connectDB;