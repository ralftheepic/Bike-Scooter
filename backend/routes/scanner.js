import express from 'express';
import Product from '../models/Product.js';
import logger from '../utils/logger.js'; // Ensure logger.js uses ES module export

const router = express.Router();

// Route to fetch product details based on scanned productId
router.get('/:productId', async (req, res) => {
  const scannedProductId = req.params.productId;

  try {
    const product = await Product.findOne({ productId: scannedProductId });

    if (product) {
      logger.info(`Product found for ID: ${scannedProductId}`, {
        productId: scannedProductId,
        productName: product.name,
      });
      res.json(product);
    } else {
      logger.warn(`Product not found for ID: ${scannedProductId}`, {
        productId: scannedProductId,
      });
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    logger.error(`Error fetching product for ID: ${scannedProductId}`, {
      productId: scannedProductId,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Error fetching product details' });
  }
});

export default router;
