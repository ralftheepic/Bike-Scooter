import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import logger from './utils/logger.js';
import productRoutes from './routes/productRoutes.js';
import healthRoutes from './routes/health.js';
import bulkOrderRoutes from './routes/bulkOrder.js';
import billRoutes from './routes/bill.js';
import { checkLowStock } from './utils/monitor.js'; 
import scannerRoutes from './routes/scanner.js';// 🆕 Import the monitor

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
app.use('/api/bulk-orders', bulkOrderRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/products/barcode', scannerRoutes);

// Start server
const server = app.listen(port, () => {
  logger.info(`Server started on port ${port}`);
  console.log(`Server running on port ${port}`);

  // 🆕 Run low-stock check once on startup
  checkLowStock();

  // 🆕 Check every 1 hour
  setInterval(checkLowStock, 1000 * 60 * 60); // 1 hour interval
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
