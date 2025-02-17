import express from 'express';
import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';

const router = express.Router();

router.get('/health/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check database
    const dbCheck = await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    
    // System uptime
    const uptime = process.uptime();

    const status = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {
        database: {
          status: dbCheck ? 'up' : 'down',
          latency: `${dbLatency}ms`
        },
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
        },
        uptime: Math.round(uptime) + 's'
      }
    };

    logger.info('Health check completed', status);
    res.json(status);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const monitoringRouter = router; 