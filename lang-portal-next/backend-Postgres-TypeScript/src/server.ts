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

const app = express();

// Security middleware
setupSecurity(app);

// Basic middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// Health check route
app.use('/api', healthCheckRouter);

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

// Error handling middleware should be last
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

export type AppRouter = typeof appRouter;