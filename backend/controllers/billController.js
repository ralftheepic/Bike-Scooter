import Bill from '../models/Billing.js';
import Product from '../models/Product.js';
import logger from '../utils/logger.js';

const saveBill = async (req, res) => {
  const { customerName, billingDate, items, totalAmount } = req.body;

  try {
    const newBill = new Bill({
      customerName,
      billingDate,
      items,
      totalAmount,
    });

    const savedBill = await newBill.save();

    for (const item of items) {
      const { nameDescription, quantity } = item;

      // Use regex to extract name, brand, model
      const nameMatch = nameDescription.match(/^(.+?)\s*(\(|\[| -)/);
      const brandMatch = nameDescription.match(/\(([^)]+)\)/);
      const modelMatch = nameDescription.match(/\[([^\]]+)\]/);

      const name = nameMatch ? nameMatch[1].trim() : null;
      const brand = brandMatch ? brandMatch[1].trim() : null;
      const model = modelMatch ? modelMatch[1].trim() : null;

      logger.info(`Parsed: name="${name}", brand="${brand}", model="${model}" from "${nameDescription}"`);

      if (!name) {
        logger.warn(`Could not extract product name from "${nameDescription}"`);
        continue;
      }

      const product = await Product.findOne({ name, brand, model });

      if (product) {
        if (product.quantity >= quantity) {
          product.quantity -= Number(quantity);
          await product.save();
          logger.info(`Decreased quantity of "${name} ${brand || ''} ${model || ''}" by ${quantity}`);
        } else {
          logger.error(`Insufficient stock for "${name} ${brand || ''} ${model || ''}". Requested: ${quantity}, Available: ${product.quantity}`);
        }
      } else {
        logger.warn(`Product not found for "${name} ${brand || ''} ${model || ''}"`);
      }
    }

    res.status(201).json(savedBill);
  } catch (error) {
    logger.error('Error saving bill:', error);
    res.status(500).json({ message: 'Error saving bill', error: error.message });
  }
};

export default { saveBill };
