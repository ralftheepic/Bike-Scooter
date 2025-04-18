// backend/routes/billRoutes.js
import express from 'express';
import billController from '../controllers/billController.js';

const router = express.Router();

// Route to save a bill
router.post('/', billController.saveBill);

export default router;
