import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';
import { env } from '../config/env';

export const setupSecurity = (app: Express) => {
  // Basic security headers
  app.use(helmet());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX
  });

  app.use(limiter);

  // Disable X-Powered-By header
  app.disable('x-powered-by');
}; 