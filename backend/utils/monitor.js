import Product from '../models/Product.js';
import { sendBulkLowStockAlert  } from './notifier.js';

const LOW_STOCK_LIMIT = 5;

export const checkLowStock = async () => {
  try {
    const lowStockProducts = await Product.find({ quantity: { $lt: LOW_STOCK_LIMIT } });
    
    for (const product of lowStockProducts) {
      await sendBulkLowStockAlert(product);
    }
  } catch (err) {
    console.error('Error checking low stock:', err.message);
  }
};
