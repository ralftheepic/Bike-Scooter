// backend/routes/scanner.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // Or your Bike/Scooter models
const logger = require('../utils/logger'); // Assuming you have a logger

// Route to fetch product details based on scanned productId
router.get('/:productId', async (req, res) => {
  const scannedProductId = req.params.productId;

  try {
    const product = await Product.findOne({ productId: scannedProductId });

    if (product) {
      logger.info(`Product found for ID: ${scannedProductId}`, { productId: scannedProductId, productName: product.name });
      res.json(product);
    } else {
      logger.warn(`Product not found for ID: ${scannedProductId}`, { productId: scannedProductId });
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    logger.error(`Error fetching product for ID: ${scannedProductId}`, { productId: scannedProductId, error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error fetching product details' });
  }
});

module.exports = router;