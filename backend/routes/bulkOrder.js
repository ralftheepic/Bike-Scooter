import express from 'express';
const router = express.Router();

import { addBulkOrder,getAllBulkOrders } from '../controllers/bulkOrderController.js';

router.post('/', addBulkOrder); // <-- Just '/', not '/api/bulk-orders'
router.get('/', getAllBulkOrders);

export default router;
