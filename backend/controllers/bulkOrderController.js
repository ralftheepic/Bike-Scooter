// backend/controllers/bulkOrderController.js

import BulkOrder from '../models/BulkOrders.js';
import Product from '../models/Product.js';

export const addBulkOrder = async (req, res) => {
  try {
    const { distributorSource, receiptDate, totalBillAmount, items } = req.body;
    const bulkOrderItemsForDB = [];

    for (const item of items) {
      console.log('Received item:', item);

      if (typeof item.price !== 'number' || isNaN(item.price)) {
        return res.status(400).json({
          message: `Missing or invalid 'price' for productId: ${item.productId}`,
        });
      }

      let product;

      const existingProduct = await Product.findOne({ productId: item.productId });

      if (existingProduct) {
        existingProduct.quantity += item.quantityReceived;
        await existingProduct.save();
        product = existingProduct._id;
      } else {
        const newProduct = new Product({
          productId: item.productId,
          name: item.name,
          brand: item.brand,
          model: item.model,
          category: item.category,
          quantity: item.quantityReceived,
          price: item.price, // Required
        });

        const savedProduct = await newProduct.save();
        product = savedProduct._id;
      }

      bulkOrderItemsForDB.push({
        product,
        productId: item.productId,
        name: item.name,
        brand: item.brand,
        model: item.model,
        category: item.category,
        quantityReceived: item.quantityReceived,
        purchasePrice: item.purchasePrice,
        price: item.price,
      });
    }

    const newBulkOrder = new BulkOrder({
      distributorSource,
      receiptDate,
      totalBillAmount: parseFloat(totalBillAmount),
      items: bulkOrderItemsForDB,
    });

    const savedBulkOrder = await newBulkOrder.save();
    res.status(201).json(savedBulkOrder);
  } catch (error) {
    console.error('Error adding bulk order:', error);
    res.status(500).json({ message: 'Failed to add bulk order', error: error.message });
  }
};
