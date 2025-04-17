// backend/index.js (or server.js)
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import logger from './utils/logger.js'; // Assuming you have a logger
import productRoutes from './routes/productRoutes.js';
import healthRoutes from './routes/health.js';

const app = express();
const port = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());


const server = app.listen(port, () => {
  logger.info(`Server started on port ${port}`);
});

// Handle graceful shutdown
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



  // Log when the server is ready
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
  app.use('/health', healthRoutes);
    // Use the product routes for /api/products endpoint
    app.use('/api/products', productRoutes);
  
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });