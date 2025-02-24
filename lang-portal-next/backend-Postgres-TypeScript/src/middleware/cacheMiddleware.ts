import { TRPCError } from '@trpc/server';
import { createClient } from 'redis';
import { logger } from '../utils/logger';
import { t } from '../trpc';  // Import the t object from trpc
import { Context } from '../context';  // Import the Context type

const DEFAULT_EXPIRATION = 60; // 1 hour in seconds

export const cacheMiddleware = (duration: number = DEFAULT_EXPIRATION) => {
  return t.middleware(async ({ ctx, next, path }: { ctx: Context; next: () => Promise<any>; path: string }) => {
    // Skip caching for non-query operations
    if (ctx.req?.method !== 'GET') {
      return next();
    }

    const redisClient = createClient();
    await redisClient.connect();
    const redis = redisClient;
    const cacheKey = `cache:${path}`;

    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit', { key: cacheKey });
        return JSON.parse(cached);
      }

      // If not in cache, execute the procedure
      const result = await next();

      // Cache the result
      await redis.setEx(cacheKey, duration, JSON.stringify(result));

      return result;
    } catch (error) {
      // If redis fails, just continue without caching
      logger.error('Cache middleware error:', error);
      return next();
    }
  });
};

export const clearCache = async (pattern: string) => {
  const redisClient = createClient();
  await redisClient.connect();
  const redis = redisClient;
  const keys = await redis.keys(`cache:${pattern}`);
  if (keys.length > 0) {
    await redis.del(keys);
    logger.info('Cache cleared', { pattern, count: keys.length });
  }
};