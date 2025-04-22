// In your paymentRoutes.js or billRoutes.js

import express from 'express';
const router = express.Router();
import Payment from '../models/Payment.js'; // Adjust the path if needed
import logger from '../utils/logger.js'; // Assuming you have a logger

// GET /api/payments - Get all payment records
router.get('/', async (req, res) => {
  try {
    logger.info('Fetching all payment records');
    // Fetch all payments, maybe sort by date descending
    const payments = await Payment.find({}).sort({ paymentDate: -1 });
    res.status(200).json(payments);
  } catch (error) {
    logger.error('Error fetching payment records:', error);
    res.status(500).json({ message: 'Internal server error fetching payments', error: error.message });
  }
});

// ... other payment related routes (if any)

export default router;
