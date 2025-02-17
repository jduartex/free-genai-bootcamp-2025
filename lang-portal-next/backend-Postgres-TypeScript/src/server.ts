import express from 'express';
import cors from 'cors';
import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './context';
import { appRouter } from './routers/appRouter';
import { errorHandler } from './middleware/errorMiddleware';

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  '/api/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Error handling middleware should be last
app.use(errorHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export type AppRouter = typeof appRouter;