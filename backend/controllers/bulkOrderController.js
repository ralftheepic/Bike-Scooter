// backend/controllers/bulkOrderController.js

import BulkOrder from '../models/BulkOrders.js';
import Product from '../models/Product.js';

export const addBulkOrder = async (req, res) => {
  try {
    console.log('test data ',req.body);
    const { distributorSource, receiptDate, totalBillAmount, items } = req.body;
    const bulkOrderItemsForDB = [];

    for (const item of items) {
      console.log('Received item:', item);

      if (typeof item.purchasePrice !== 'number' || isNaN(item.purchasePrice)) {
        return res.status(400).json({
          message: `Missing or invalid 'price' for item with name: ${item.name}, brand: ${item.brand}, model: ${item.model}`,
        });
      }

      // Search by name + brand + model instead of productId
      let productDoc = await Product.findOne({
        name: item.name,
        brand: item.brand,
        model: item.model,
      });

      if (productDoc) {
        // Product exists, update quantity
        productDoc.quantity += item.quantityReceived;
        await productDoc.save();
      } else {
        // Product doesn't exist, create new
        productDoc = await Product.create({
          productId: item.productId, // still storing it, but not using for uniqueness
          name: item.name,
          brand: item.brand,
          model: item.model,
          category: item.category,
          quantity: item.quantityReceived,
          price: item.purchasePrice,
          partNo: item.partNo || '', 
        });
      }

      bulkOrderItemsForDB.push({
        product: productDoc._id,
        quantityReceived: item.quantityReceived,
        purchasePrice: item.purchasePrice,
        price: item.price,
      });
    }

    const newBulkOrder = await BulkOrder.create({
      distributorSource,
      receiptDate,
      totalBillAmount: parseFloat(totalBillAmount),
      items: bulkOrderItemsForDB,
    });

    res.status(201).json(newBulkOrder);
  } catch (error) {
    console.error('Error adding bulk order:', error);
    res.status(500).json({ message: 'Failed to add bulk order', error: error.message });
  }
};

// Controller to fetch all bulk orders
export const getAllBulkOrders = async (req, res) => {
  try {
    const allBulkOrders = await BulkOrder.find({}).populate('items.product', 'name brand model partNo price quantity'); // Added 'quantity' here (this is the current stock quantity, not the ordered quantity)
    res.status(200).json(allBulkOrders);
  } catch (error) {
    console.error('Error fetching all bulk orders:', error);
    res.status(500).json({ message: 'Failed to fetch all bulk orders', error: error.message });
  }
};
