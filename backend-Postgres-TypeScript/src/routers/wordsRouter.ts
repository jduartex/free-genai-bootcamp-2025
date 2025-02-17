import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const wordsRouter = router({
  list: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.word.findMany();
    }),
  
  getById: publicProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.word.findUnique({
        where: { id: input }
      });
    })
}); 