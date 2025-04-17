import express from 'express';
import productController from '../controllers/productController.js'; // Ensure this is using ES import
import logger from '../utils/logger.js'; // Import your logger

const router = express.Router();

// POST request to add a product
router.post('/', async (req, res) => {
  logger.info('Received POST request at /api/products', { body: req.body });

  try {
    await productController.addProduct(req, res); // Call your controller to add the product
  } catch (error) {
    logger.error('Error handling POST request to /api/products:', error); // Log errors with context
    res.status(500).json({ message: 'Error adding product', error: error.message });
  }
});

// GET request to get all products
router.get('/', async (req, res) => {
  logger.info('Received GET request at /api/products');

  try {
    await productController.getAllProducts(req, res); // Call your controller to get all products
  } catch (error) {
    logger.error('Error handling GET request to /api/products:', error); // Log errors with context
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// DELETE request to delete all products - USE WITH CAUTION
router.delete('/', async (req, res) => {
  logger.warn('Received DELETE request at /api/products - USE WITH EXTREME CAUTION!');

  try {
    await productController.deleteAllProducts(req, res); // Call your controller to delete all products
  } catch (error) {
    logger.error('Error handling DELETE request to /api/products:', error); // Log errors with context
    res.status(500).json({ message: 'Error deleting all products', error: error.message });
  }
});

export default router; // Default export for the router