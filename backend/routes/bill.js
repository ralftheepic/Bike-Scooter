import express from 'express';
import billController from '../controllers/billController.js';

const router = express.Router();

// Route to save a new bill (draft or finalized)
router.post('/', billController.saveBill);

router.get('/finalized', billController.getFinalizedBills);
router.get('/drafts', billController.getDraftBills);
router.get('/:id', billController.getDraftBill);

router.put('/:id', billController.updateDraftBill);

router.put('/:id/finalize', billController.finalizeBill);

router.delete('/:id', billController.deleteBill);

export default router;