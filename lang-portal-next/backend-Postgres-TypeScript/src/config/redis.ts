import { createClient } from 'redis';
import { logger } from '../utils/logger';
import { env } from './env';

export const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis max retries reached');
        return new Error('Redis max retries reached');
      }
      return Math.min(retries * 100, 3000);
    },
  }
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Redis connection failed', error);
    throw error;
  }
};