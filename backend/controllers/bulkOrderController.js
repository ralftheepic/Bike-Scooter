import BulkOrder from '../models/BulkOrders.js';
import Product from '../models/Product.js';
import logger from '../utils/logger.js';

export const addBulkOrder = async (req, res) => {
  try {
    const { distributorSource, receiptDate, totalBillAmount, items } = req.body;
    const bulkOrderItemsForDB = [];

    for (const item of items) {
      if (typeof item.purchasePrice !== 'number' || isNaN(item.purchasePrice)) {
        return res.status(400).json({
          message: `Missing or invalid 'price' for item with name: ${item.name}, brand: ${item.brand}, model: ${item.model}`,
        });
      }

      let productDoc = await Product.findOne({
        name: item.name,
        brand: item.brand,
        model: item.model,
      });

      if (productDoc) {
        productDoc.quantity += item.quantityReceived;
        await productDoc.save();
      } else {
        productDoc = await Product.create({
          productId: item.productId,
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
    res.status(500).json({ message: 'Failed to add bulk order', error: error.message });
  }
};

export const getAllBulkOrders = async (req, res) => {
  logger.info("Fetching all bulk orders");
  try {
    const allBulkOrders = await BulkOrder.find({}).populate('items.product', 'name brand model partNo productId price quantity');

    const processedBulkOrders = allBulkOrders.map(order => {
      const orderObject = order.toObject();

      orderObject.items = orderObject.items.map(item => {
        if (item.product) {
          return {
            ...item,
            productDetails: {
              partNo: item.product.partNo ? item.product.partNo : item.product.productId || 'N/A',
              name: item.product.name || 'N/A',
              brand: item.product.brand || 'N/A',
              model: item.product.model || 'N/A',
              price: item.product.price,
              currentStock: item.product.quantity
            }
          };
        } else {
          logger.warn(`Bulk Order ${order._id}: Product not found for item:`, JSON.stringify(item));
          return {
            ...item,
            productDetails: {
              partNo: item.productId || 'N/A',
              name: item.name || 'Product Not Found',
              brand: item.brand || 'N/A',
              model: item.model || 'N/A',
              price: item.purchasePrice,
              currentStock: 'N/A'
            }
          };
        }
      });

      logger.info(`Bulk Order ${JSON.stringify(orderObject)}: Processed successfully.`);
      return orderObject;
    });

    logger.info("Successfully processed bulk orders.");
    res.status(200).json(processedBulkOrders);
  } catch (error) {
    logger.error('Error fetching all bulk orders:', error);
    res.status(500).json({ message: 'Failed to fetch all bulk orders', error: error.message });
  }
};
