import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const studySessionsRouter = router({
  list: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(100)
    }))
    .query(async ({ ctx, input }) => {
      return ctx.services.studySessions.listSessions(input.page, input.limit);
    }),

  getById: publicProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      return ctx.services.studySessions.getSessionById(input);
    }),

  getSessionWords: publicProcedure
    .input(z.object({
      sessionId: z.number(),
      page: z.number().default(1),
      limit: z.number().default(100)
    }))
    .query(async ({ ctx, input }) => {
      return ctx.services.studySessions.getSessionWords(
        input.sessionId,
        input.page,
        input.limit
      );
    }),

  submitReview: publicProcedure
    .input(z.object({
      sessionId: z.number(),
      wordId: z.number(),
      correct: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.studySessions.createReview(
        input.sessionId,
        input.wordId,
        input.correct
      );
    })
}); 