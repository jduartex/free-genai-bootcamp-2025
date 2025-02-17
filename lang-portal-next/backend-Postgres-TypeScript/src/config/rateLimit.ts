import rateLimit from 'express-rate-limit';
import { env } from './env';
import { logger } from '../utils/logger';

const createLimiter = (
  windowMs: number,
  max: number,
  message: string
) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      limit: options.max
    });
    res.status(429).json(options.message);
  }
});

export const rateLimits = {
  // General API limit
  api: createLimiter(
    15 * 60 * 1000, // 15 minutes
    env.RATE_LIMIT_MAX,
    'Too many requests, please try again later.'
  ),

  // Stricter limits for specific endpoints
  auth: createLimiter(
    60 * 60 * 1000, // 1 hour
    100,
    'Too many authentication attempts, please try again later.'
  ),

  // Study sessions have higher limits
  studySessions: createLimiter(
    60 * 1000, // 1 minute
    200,
    'Too many study session requests, please try again later.'
  ),

  // Words API has medium limits
  words: createLimiter(
    60 * 1000, // 1 minute
    150,
    'Too many word requests, please try again later.'
  )
}; 