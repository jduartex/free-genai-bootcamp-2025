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
      const session = await ctx.prisma.studySession.findUnique({
        where: { id: input.sessionId },
      });

      if (!session) {
        throw new Error('StudySession not found');
      }

      const updatedSession = await ctx.prisma.studySession.update({
        where: { id: input.sessionId },
        data: {
          reviews: {
            create: {
              wordId: input.wordId,
              correct: input.correct
            }
          }
        },
        include: {
          reviews: true
        }
      });

      return updatedSession;
    }),

  getWordsByStudySessionId: publicProcedure
    .input(z.object({
      id: z.number(),
      page: z.number().default(1),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      const { id, page, limit } = input;
      const offset = (page - 1) * limit;

      const [items, totalItems] = await ctx.prisma.$transaction([
        ctx.prisma.wordReviewItem.findMany({
          where: { studySessionId: id },
          skip: offset,
          take: limit,
          include: {
            word: true,
          },
        }),
        ctx.prisma.wordReviewItem.count({
          where: { studySessionId: id },
        }),
      ]);

      return {
        items: items.map(item => ({
          japanese: item.word.japanese,
          romaji: item.word.romaji,
          english: item.word.english,
          correct_count: item.correct ? 1 : 0,
          wrong_count: item.correct ? 0 : 1,
        })),
        pagination: {
          current_page: page,
          total_pages: Math.ceil(totalItems / limit),
          total_items: totalItems,
          items_per_page: limit,
        },
      };
    })
});