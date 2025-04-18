import express from 'express';
const router = express.Router();

import { addBulkOrder } from '../controllers/bulkOrderController.js';

router.post('/', addBulkOrder); // <-- Just '/', not '/api/bulk-orders'

export default router;
