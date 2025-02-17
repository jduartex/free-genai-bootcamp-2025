import { router, publicProcedure } from '../trpc';

/**
 * @swagger
 * /api/trpc/statistics.dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_words_studied:
 *                   type: integer
 *                 total_available_words:
 *                   type: integer
 */

/**
 * @swagger
 * /api/trpc/statistics.quickStats:
 *   get:
 *     summary: Get quick overview statistics
 *     responses:
 *       200:
 *         description: Quick statistics overview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success_rate:
 *                   type: number
 *                   format: float
 *                 total_study_sessions:
 *                   type: integer
 *                 total_active_groups:
 *                   type: integer
 *                 study_streak_days:
 *                   type: integer
 */

/**
 * @swagger
 * /api/trpc/statistics.resetHistory:
 *   post:
 *     summary: Reset study history
 *     responses:
 *       200:
 *         description: History reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /api/trpc/statistics.fullReset:
 *   post:
 *     summary: Full system reset
 *     responses:
 *       200:
 *         description: System reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
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