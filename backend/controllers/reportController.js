// Path: backend/controllers/reportsController.js

import Bill from '../models/Billing.js'; // Assuming your Bill model path
import BulkOrder from '../models/BulkOrders.js'; // Assuming your BulkOrder model path
import logger from '../utils/logger.js'; // Assuming your logger setup
import mongoose from 'mongoose';

// Helper function to calculate date ranges
const getDateRange = (period, value) => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    endDate.setHours(23, 59, 59, 999); // Set end date to end of the day

    if (period === 'months') {
        // Go back 'value' months from the start of the current month
        startDate.setDate(1); // Start from the first day of the current month
        startDate.setHours(0, 0, 0, 0);
        startDate.setMonth(startDate.getMonth() - (value - 1)); // Go back N-1 full months
        startDate.setDate(1); // Ensure it's the first day of the starting month
    } else if (period === 'weeks') {
         // Go back 'value' weeks from the end of the current week (approx)
         // This is a simplified approach. ISO week calculation is more complex.
         const today = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
         startDate.setDate(now.getDate() - today); // Start of the current week (Sunday)
         startDate.setHours(0, 0, 0, 0);
         startDate.setDate(startDate.getDate() - (value - 1) * 7); // Go back N-1 full weeks

    } else if (period === 'days') {
        // Assumes 'value' is a number of days to go back
        startDate.setDate(now.getDate() - (value - 1));
        startDate.setHours(0, 0, 0, 0);
    } else if (period === 'dateRange' && value.startDate && value.endDate) {
        startDate = new Date(value.startDate);
        endDate = new Date(value.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    } else {
        // Default to last 30 days if period/value is invalid
        startDate.setDate(now.getDate() - 29); // Last 30 days including today
        startDate.setHours(0, 0, 0, 0);
    }

     // Ensure start date is not in the future
     if (startDate > now) {
         startDate = new Date(now);
         startDate.setHours(0,0,0,0);
     }
      // Ensure end date is not in the future
     if (endDate > now) {
        endDate = new Date(now);
     }


    return { startDate, endDate };
};


// Get Monthly Sales Report (used by Dashboard)
export const getMonthlySales = async (req, res) => {
    const months = parseInt(req.query.months) || 6; // Default to last 6 months
    const { startDate } = getDateRange('months', months);

    logger.info(`Workspaceing monthly sales report for dashboard from ${startDate.toISOString()} to now`);

    try {
        const monthlySales = await Bill.aggregate([
            {
                $match: {
                    finalizedAt: { $gte: startDate }, // Use finalizedAt for sales date
                    totalAmount: { $exists: true, $ne: null }, // Ensure totalAmount exists
                     // Optional: Add condition for payment method if needed, e.g., paymentMethod: { $ne: 'Draft' }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$finalizedAt" },
                        month: { $month: "$finalizedAt" }
                    },
                    total: { $sum: "$totalAmount" }
                }
            },
            {
                 $project: {
                     _id: 0, // Exclude the default _id
                     period: { // Format the output period string
                         $concat: [
                             { $toString: "$_id.year" },
                             "-",
                              // Pad month with leading zero if needed
                             { $cond: [{ $lt: ["$_id.month", 10] }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" }] }
                         ]
                     },
                     total: "$total"
                 }
             },
            {
                $sort: { period: 1 } // Sort by period ascending
            }
        ]);

        res.status(200).json(monthlySales);
    } catch (error) {
        logger.error('Error fetching monthly sales report:', error);
        res.status(500).json({ message: 'Internal server error fetching monthly sales report', error: error.message });
    }
};

// Get Weekly Sales Report (Simplified Week Number - used by Dashboard)
export const getWeeklySales = async (req, res) => {
     const weeks = parseInt(req.query.weeks) || 4; // Default to last 4 weeks
     const { startDate } = getDateRange('weeks', weeks);

     logger.info(`Workspaceing weekly sales report for dashboard from ${startDate.toISOString()} to now`);

    try {
        const weeklySales = await Bill.aggregate([
            {
                $match: {
                    finalizedAt: { $gte: startDate },
                    totalAmount: { $exists: true, $ne: null },
                }
            },
            {
                $group: {
                    _id: {
                         year: { $year: "$finalizedAt" },
                         // Note: $week is not ISO 8601 week number.
                         // For ISO week, you'd need a more complex aggregation.
                         week: { $week: "$finalizedAt" } // Week number within the year (0-53)
                    },
                    total: { $sum: "$totalAmount" }
                }
            },
             {
                 $project: {
                     _id: 0,
                     period: {
                         $concat: [
                             { $toString: "$_id.year" },
                             "-W",
                              // Pad week with leading zero
                            { $cond: [{ $lt: ["$_id.week", 10] }, { $concat: ["0", { $toString: "$_id.week" }] }, { $toString: "$_id.week" }] }

                         ]
                     },
                     total: "$total"
                 }
             },
            {
                $sort: { period: 1 } // Sort by period ascending
            }
        ]);

        res.status(200).json(weeklySales);
    } catch (error) {
        logger.error('Error fetching weekly sales report:', error);
        res.status(500).json({ message: 'Internal server error fetching weekly sales report', error: error.message });
    }
};

// Get Daily Sales Report (used by Dashboard, can accept date range)
export const getDailySales = async (req, res) => {
    // You can add query parameters for startDate and endDate
    const { startDate, endDate } = getDateRange(
        'dateRange',
         { startDate: req.query.startDate, endDate: req.query.endDate }
    ); // Use dateRange helper

    logger.info(`Workspaceing daily sales report for dashboard from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    try {
        const dailySales = await Bill.aggregate([
            {
                $match: {
                    finalizedAt: { $gte: startDate, $lte: endDate },
                    totalAmount: { $exists: true, $ne: null },
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$finalizedAt" },
                        month: { $month: "$finalizedAt" },
                        day: { $dayOfMonth: "$finalizedAt" }
                    },
                    total: { $sum: "$totalAmount" }
                }
            },
             {
                 $project: {
                     _id: 0,
                     period: {
                         $concat: [
                             { $toString: "$_id.year" },
                             "-",
                             { $cond: [{ $lt: ["$_id.month", 10] }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" }] },
                             "-",
                             { $cond: [{ $lt: ["$_id.day", 10] }, { $concat: ["0", { $toString: "$_id.day" }] }, { $toString: "$_id.day" }] }
                         ]
                     },
                     total: "$total"
                 }
             },
            {
                $sort: { period: 1 } // Sort by period ascending
            }
             // Optional: Add $limit if you only want the last N days
        ]);

        res.status(200).json(dailySales);
    } catch (error) {
        logger.error('Error fetching daily sales report:', error);
        res.status(500).json({ message: 'Internal server error fetching daily sales report', error: error.message });
    }
};


// Get Monthly Purchases Report (used by Dashboard)
export const getMonthlyPurchases = async (req, res) => {
    const months = parseInt(req.query.months) || 6; // Default to last 6 months
    const { startDate } = getDateRange('months', months);

    logger.info(`Workspaceing monthly purchases report for dashboard from ${startDate.toISOString()} to now`);

    try {
        const monthlyPurchases = await BulkOrder.aggregate([
            {
                $match: {
                    receiptDate: { $gte: startDate }, // Use receiptDate for purchase date
                    totalBillAmount: { $exists: true, $ne: null }, // Ensure totalBillAmount exists
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$receiptDate" },
                        month: { $month: "$receiptDate" }
                    },
                    total: { $sum: "$totalBillAmount" }
                }
            },
            {
                 $project: {
                     _id: 0,
                     period: {
                         $concat: [
                             { $toString: "$_id.year" },
                             "-",
                             { $cond: [{ $lt: ["$_id.month", 10] }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" }] }
                         ]
                     },
                     total: "$total"
                 }
             },
            {
                $sort: { period: 1 } // Sort by period ascending
            }
        ]);

        res.status(200).json(monthlyPurchases);
    } catch (error) {
        logger.error('Error fetching monthly purchases report:', error);
        res.status(500).json({ message: 'Internal server error fetching monthly purchases report', error: error.message });
    }
};