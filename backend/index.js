import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import logger from './utils/logger.js';
import productRoutes from './routes/productRoutes.js';
import healthRoutes from './routes/health.js';
import bulkOrderRoutes from './routes/bulkOrder.js';

const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});
app.use('/health', healthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bulk-orders', bulkOrderRoutes); // <-- This is now correctly positioned

// Start server
const server = app.listen(port, () => {
  logger.info(`Server started on port ${port}`);
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

async function gracefulShutdown() {
  logger.info('Shutting down server...');
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed.');
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  } catch (err) {
    logger.error('Error during shutdown:', err);
    process.exit(1);
  }
}
