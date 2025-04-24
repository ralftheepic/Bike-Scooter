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
import scannerRoutes from './routes/scanner.js';
import frontendLogRoutes from './routes/frontendLog.js';
import paymentRoutes from './routes/payment.js';
import reportsRoutes from './routes/reports.js';
import cron from 'node-cron';
import dotenv from 'dotenv'

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;


const LOW_STOCK_LIMIT = 5; // Make sure this constant is accessible

connectDB(); 
mongoose.connection.once('open', () => {
  console.log('MongoDB connection successful. Scheduling cron jobs...');

  // --- Schedule the Daily Low Stock Cron Job ---
  // Example: '0 9 * * *' means 0 minutes, 9 hours = 9:00 AM daily
  const dailyLowStockCronPattern = '0 9 * * *'; // Change 9 to your desired hour (0-23)

  cron.schedule(dailyLowStockCronPattern, () => {
    console.log(`Cron job triggered: Running daily low stock check (${new Date().toISOString()})`);
    checkLowStock(); 
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log(`Daily low stock cron job scheduled with pattern: ${dailyLowStockCronPattern} in timezone Asia/Kolkata.`);

}); // Schedule cron after DB is open

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
  console.error('MongoDB connection error:', err);
});


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
app.use('/api/frontend-logs', frontendLogRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportsRoutes);


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
     // Stop all scheduled cron jobs on shutdown
     cron.getTasks().forEach(task => task.stop());
     logger.info('Stopped all cron tasks.');

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