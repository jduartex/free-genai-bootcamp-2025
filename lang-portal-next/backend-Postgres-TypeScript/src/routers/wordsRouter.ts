import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { cacheMiddleware, clearCache } from '../middleware/cacheMiddleware';
import { env } from '../config/env';
import { rateLimits } from '../config/rateLimit';

/**
 * @swagger
 * /api/trpc/words.list:
 *   get:
 *     summary: Get a list of words
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
 *         description: List of words with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       japanese:
 *                         type: string
 *                       romaji:
 *                         type: string
 *                       english:
 *                         type: string
 *                       correct_count:
 *                         type: integer
 *                       wrong_count:
 *                         type: integer
 */
export const wordsRouter = router({
  list: publicProcedure
    .use(async ({ ctx, next }) => {
      await new Promise((resolve) => 
        rateLimits.words(ctx.req, ctx.res, resolve)
      );
      return next();
    })
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(100)
    }))
    .use(cacheMiddleware(env.REDIS_CACHE_DURATION))
    .query(async ({ ctx, input }) => {
      return ctx.services.words.listWords(input.page, input.limit);
    }),
  
  getById: publicProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      return ctx.services.words.getWordById(input);
    }),

  create: publicProcedure
    .input(wordCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.words.createWord(input);
      await clearCache('words*');
      return result;
    })
}); 