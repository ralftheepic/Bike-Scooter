import express from 'express';
import frontendLogController from '../controllers/frontendLogController.js';

const router = express.Router();

// Define the POST route for receiving frontend logs
router.post('/', frontendLogController.logFrontendError);

export default router;
