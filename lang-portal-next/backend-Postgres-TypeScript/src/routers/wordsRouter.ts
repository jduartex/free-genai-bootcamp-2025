import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const wordsRouter = router({
  list: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(100)
    }))
    .query(async ({ ctx, input }) => {
      return ctx.services.words.listWords(input.page, input.limit);
    }),
  
  getById: publicProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      return ctx.services.words.getWordById(input);
    })
}); 