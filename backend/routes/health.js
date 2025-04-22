// backend/routes/health.js
import express from 'express';
const router = express.Router();
import mongoose from 'mongoose';
import logger from '../utils/logger.js'; 

router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) { // 1 means connected
      try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);
        res.status(200).send({
          status: 'OK',
          message: 'MongoDB is connected and healthy',
          collections: collectionNames
        });
      } catch (err) {
        logger.error('Error listing collections:', err);
        res.status(500).send({
          status: 'ERROR',
          message: 'Error listing collections',
          error: err.message
        });
      }
    } else {
      res.status(503).send({
        status: 'ERROR',
        message: 'MongoDB is not connected',
        readyState: mongoose.connection.readyState
      });
    }
  } catch (error) {
    logger.error('Error checking database health:', error);
    res.status(500).send({ status: 'ERROR', message: 'Error checking database health', error: error.message });
  }
});

export default router;