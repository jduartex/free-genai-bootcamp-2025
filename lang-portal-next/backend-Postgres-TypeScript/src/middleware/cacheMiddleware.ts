import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

const DEFAULT_EXPIRATION = 3600; // 1 hour in seconds

export const cacheMiddleware = (duration = DEFAULT_EXPIRATION) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        logger.debug('Cache hit', { key });
        return res.json(JSON.parse(cachedData));
      }

      // Store the original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = ((data: any) => {
        redisClient.setEx(key, duration, JSON.stringify(data))
          .catch(err => logger.error('Cache set error', { key, err }));
        return originalJson(data);
      }) as any;

      next();
    } catch (error) {
      logger.error('Cache middleware error', error);
      next();
    }
  };
};

export const clearCache = async (pattern: string) => {
  try {
    const keys = await redisClient.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info('Cache cleared', { pattern, count: keys.length });
    }
  } catch (error) {
    logger.error('Clear cache error', error);
  }
}; 