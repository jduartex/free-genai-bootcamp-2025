import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const groupsRouter = router({
  list: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(100)
    }))
    .query(async ({ ctx, input }) => {
      return ctx.services.groups.listGroups(input.page, input.limit);
    }),

  getById: publicProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      return ctx.services.groups.getGroupById(input);
    }),

  getGroupWords: publicProcedure
    .input(z.object({
      groupId: z.number(),
      page: z.number().default(1),
      limit: z.number().default(100)
    }))
    .query(async ({ ctx, input }) => {
      return ctx.services.groups.getGroupWords(
        input.groupId,
        input.page,
        input.limit
      );
    })
}); 