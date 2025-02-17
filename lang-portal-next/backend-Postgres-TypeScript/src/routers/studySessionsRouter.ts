import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { rateLimits } from '../config/rateLimit';

/**
 * @swagger
 * /api/trpc/studySessions.list:
 *   get:
 *     summary: Get a list of study sessions
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of study sessions with pagination
 */

/**
 * @swagger
 * /api/trpc/studySessions.submitReview:
 *   post:
 *     summary: Submit a word review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: integer
 *               wordId:
 *                 type: integer
 *               correct:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Review submitted successfully
 *       404:
 *         description: Session or word not found
 */
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
    .use(async ({ ctx, next }) => {
      await new Promise((resolve) => 
        rateLimits.studySessions(ctx.req, ctx.res, resolve)
      );
      return next();
    })
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