import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { cacheMiddleware, clearCache } from '../middleware/cacheMiddleware';
import { env } from '../config/env';
import { rateLimits } from '../config/rateLimit';

// Add the missing schema
const wordCreateSchema = z.object({
  japanese: z.string().min(1),
  romaji: z.string().min(1),
  english: z.string().min(1),
  parts: z.object({}).passthrough().optional(),
  groupId: z.number().optional()
});

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
      const words = await ctx.services.words.listWords(input.page, input.limit);
      return words;
    }),
  
  getById: publicProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      const word = await ctx.services.words.getWordById(input);
      if (!word) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return word;
    }),

  create: publicProcedure
    .input(z.object({
      japanese: z.string().min(1),
      romaji: z.string().min(1),
      english: z.string().min(1),
      parts: z.object({}).passthrough().optional(),
      groupId: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.words.createWord(input);
      await clearCache('words*');
      return result;
    })
});

export class WordService {
  // other methods 

  async createWord(input: { japanese: string; romaji: string; english: string; parts?: object; groupId?: number }) {
    // Implementation for creating a word
    const newWord = {
      japanese: input.japanese,
      romaji: input.romaji,
      english: input.english,
      parts: input.parts,
      groupId: input.groupId,
      correct_count: 0,
      wrong_count: 0
    };
    // Save newWord to the database
    return newWord;
  }
}