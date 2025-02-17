import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const studySessionsRouter = router({
  list: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.studySession.findMany();
    })
}); 