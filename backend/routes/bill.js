import express from 'express';
import billController from '../controllers/billController.js';

const router = express.Router();

// Route to save a new bill (draft or finalized)
router.post('/', billController.saveBill);

// Route to get all draft bills
router.get('/', billController.getDraftBills); // Frontend expects this to return only drafts

// Route to get a specific draft bill by ID
router.get('/:id', billController.getDraftBill);

// Route to update an existing draft bill
router.put('/:id', billController.updateDraftBill);

// Route to finalize a specific draft bill
router.put('/:id/finalize', billController.finalizeBill);

export default router;