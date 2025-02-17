import express from 'express';
import cors from 'cors';
import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './context';
import { appRouter } from './routers/appRouter';
import { errorHandler } from './middleware/errorMiddleware';
import { requestLogger } from './middleware/loggingMiddleware';
import { healthCheckRouter } from './routes/healthCheck';
import { setupSecurity } from './middleware/securityMiddleware';
import { env } from './config/env';
import { setupSwagger } from './config/swagger';
import compression from 'compression';
import { RequestHandler } from 'express';
import { securityConfig } from './config/security';
import { monitoringRouter } from './routes/monitoringRouter';
import { errorLogger } from './middleware/loggingMiddleware';
import { metricsRouter } from './routes/metricsRouter';
import { metricsMiddleware } from './middleware/metricsMiddleware';
import { rateLimits } from './config/rateLimit';

const app = express();

// Security middleware
setupSecurity(app);

// Basic middleware
app.use(cors(securityConfig.cors));
app.use(express.json({ limit: securityConfig.bodyLimit }));
app.use((compression() as unknown) as RequestHandler);
app.use(requestLogger);

// Add metrics middleware early to capture all requests
app.use(metricsMiddleware);

// Health check route
app.use('/api', healthCheckRouter);

// Monitoring routes
app.use('/api', monitoringRouter);

// Metrics endpoint (should be before other routes)
app.use('/api', metricsRouter);

// Apply general rate limit to all routes
app.use(rateLimits.api);

// tRPC router
app.use(
  '/api/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// API Documentation
if (env.NODE_ENV !== 'production') {
  setupSwagger(app);
}

// Error logging should come before error handling
app.use(errorLogger);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

export type AppRouter = typeof appRouter;