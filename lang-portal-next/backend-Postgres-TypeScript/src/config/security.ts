import { z } from 'zod';
import { env } from './env';

export const securityConfig = {
  bodyLimit: '10mb',
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.RATE_LIMIT_MAX, // limit each IP
  },
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    referrerPolicy: { policy: 'same-origin' },
  }
};

// Request size validators
export const requestValidators = {
  maxBodySize: z.any().refine(
    (data) => JSON.stringify(data).length <= 10_000_000, // 10MB in bytes
    { message: 'Request body too large' }
  ),
  maxArrayLength: z.array(z.any()).max(1000, 'Too many items in array'),
  maxStringLength: z.string().max(100_000, 'String too long'),
}; 