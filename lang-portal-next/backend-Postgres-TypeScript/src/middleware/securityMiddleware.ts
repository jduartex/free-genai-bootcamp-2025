import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Express, Request, Response, NextFunction } from 'express';
import { securityConfig, requestValidators } from '../config/security';

export const setupSecurity = (app: Express) => {
  // Basic security headers
  app.use(helmet(securityConfig.helmet));

  // Rate limiting
  app.use(rateLimit(securityConfig.rateLimit));

  // Body size limit middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        requestValidators.maxBodySize.parse(req.body);
      } catch (error) {
        return res.status(413).json({ error: 'Payload too large' });
      }
    }
    next();
  });

  // Disable X-Powered-By header
  app.disable('x-powered-by');
}; 