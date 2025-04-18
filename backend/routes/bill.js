import express from 'express';
import billController from '../controllers/billController.js';

const router = express.Router();

// Route to save a bill (draft or finalized)
router.post('/', billController.saveBill);

// Route to get all draft bills
router.get('/', billController.getDraftBills);

// Route to finalize a draft bill and move it to the billing collection
router.put('/:id/finalize', billController.finalizeBill);

export default router;
