import { router, publicProcedure } from '../trpc';

export const statisticsRouter = router({
  dashboard: publicProcedure
    .query(async ({ ctx }) => {
      return {
        total_words_studied: await ctx.prisma.wordReviewItem.count(),
        total_available_words: await ctx.prisma.word.count()
      };
    })
}); 