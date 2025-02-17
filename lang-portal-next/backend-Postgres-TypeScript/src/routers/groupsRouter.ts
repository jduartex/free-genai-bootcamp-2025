import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const groupsRouter = router({
  list: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.group.findMany();
    })
}); 