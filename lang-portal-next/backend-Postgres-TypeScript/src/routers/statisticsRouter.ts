import { router, publicProcedure } from '../trpc';

export const statisticsRouter = router({
  dashboard: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.services.statistics.getDashboardStats();
    }),

  quickStats: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.services.statistics.getQuickStats();
    }),

  lastStudySession: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.services.statistics.getLastStudySession();
    }),

  resetHistory: publicProcedure
    .mutation(async ({ ctx }) => {
      return ctx.services.statistics.resetHistory();
    }),

  fullReset: publicProcedure
    .mutation(async ({ ctx }) => {
      return ctx.services.statistics.fullReset();
    })
}); 