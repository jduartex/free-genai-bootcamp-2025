import express from 'express';
import { register } from '../config/metrics';
import { logger } from '../utils/logger';

const router = express.Router();

router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Metrics generation failed', error);
    res.status(500).send('Error generating metrics');
  }
});

export const metricsRouter = router; 