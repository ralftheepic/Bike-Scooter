import Bill from '../models/Billing.js';
import DraftBill from '../models/DraftBills.js';
import Product from '../models/Product.js';
import logger from '../utils/logger.js';

const saveBill = async (req, res) => {
  const { customerName, billingDate, items, totalAmount, isDraft } = req.body;

  try {
    // Basic validation for required fields
    if (!customerName || !billingDate || !items || !totalAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Calculate total amount from items
    const calculatedTotalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    if (calculatedTotalAmount !== totalAmount) {
      return res.status(400).json({ message: 'Total amount does not match the sum of item prices' });
    }

    // Save the bill as draft or final
    const newBill = new (isDraft ? DraftBill : Bill)({
      customerName,
      billingDate,
      items,
      totalAmount,
      isDraft: isDraft !== undefined ? isDraft : true,
    });

    const savedBill = await newBill.save();

    // If the bill is finalized, update the stock
    if (!savedBill.isDraft) {
      for (const item of items) {
        const { nameDescription, quantity } = item;

        // Extract name, brand, and model from nameDescription
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
            product.quantity -= Number(quantity);  // Decrease stock for finalized bills
            await product.save();
            logger.info(`Decreased quantity of "${name} ${brand || ''} ${model || ''}" by ${quantity}`);
          } else {
            logger.error(`Insufficient stock for "${name} ${brand || ''} ${model || ''}". Requested: ${quantity}, Available: ${product.quantity}`);
          }
        } else {
          logger.warn(`Product not found for "${name} ${brand || ''} ${model || ''}"`);
        }
      }
    }

    res.status(201).json(savedBill);
  } catch (error) {
    logger.error('Error saving bill:', error);
    res.status(500).json({ message: 'Error saving bill', error: error.message });
  }
};

const getDraftBills = async (req, res) => {
  try {
    const draftBills = await DraftBill.find(); // Fetch only draft bills
    res.status(200).json(draftBills);
  } catch (error) {
    logger.error('Error fetching draft bills:', error);
    res.status(500).json({ message: 'Error fetching draft bills' });
  }
};

const finalizeBill = async (req, res) => {
  try {
    const draftBill = await DraftBill.findById(req.params.id);

    if (!draftBill) {
      return res.status(404).json({ message: 'Draft bill not found' });
    }

    // Create a new finalized bill
    const finalizedBill = new Bill({
      ...draftBill.toObject(),
      isDraft: false, // Set isDraft to false for finalized bills
    });

    await finalizedBill.save();
    await DraftBill.findByIdAndDelete(req.params.id); // Delete the draft bill after finalizing

    res.status(201).json(finalizedBill);
  } catch (error) {
    logger.error('Error finalizing bill:', error);
    res.status(500).json({ message: 'Error finalizing bill' });
  }
};

export default { 
  saveBill,
  getDraftBills,
  finalizeBill,
};
