
import express from 'express';
const router = express.Router();
import {
    getMonthlySales,
    getWeeklySales,
    getDailySales,
    getMonthlyPurchases,
    // Import other report functions here if you added them to the controller
} from '../controllers/reportController.js'; // Adjust path

// Define routes for your reports. These are the endpoints your frontend Dashboard.jsx will call.
router.get('/monthly-sales', getMonthlySales);
router.get('/weekly-sales', getWeeklySales);
router.get('/daily-sales', getDailySales); // Can use ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/monthly-purchases', getMonthlyPurchases);

// Add routes for other reports if you create them in the controller

export default router;