import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal } from '../config/metrics';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;

    // Record metrics
    const route = req.route ? req.route.path : req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode
    };

    httpRequestDuration.observe(labels, durationInSeconds);
    httpRequestTotal.inc(labels);
  });

  next();
}; 