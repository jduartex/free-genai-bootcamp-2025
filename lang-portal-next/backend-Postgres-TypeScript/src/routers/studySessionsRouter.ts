import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const studySessionsRouter = router({
  list: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(100)
    }))
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const [items, total] = await Promise.all([
        ctx.prisma.studySession.findMany({
          skip,
          take: input.limit,
          include: {
            group: true,
            activities: true,
            reviews: true
          }
        }),
        ctx.prisma.studySession.count()
      ]);

      return {
        items: items.map(session => ({
          id: session.id,
          activity_name: session.activities[0]?.id ? "Vocabulary Quiz" : "Unknown",
          group_name: session.group.name,
          start_time: session.createdAt,
          end_time: session.endedAt,
          review_items_count: session.reviews.length
        })),
        pagination: {
          current_page: input.page,
          total_pages: Math.ceil(total / input.limit),
          total_items: total,
          items_per_page: input.limit
        }
      };
    }),

  getById: publicProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      const session = await ctx.prisma.studySession.findUnique({
        where: { id: input },
        include: {
          group: true,
          activities: true,
          reviews: true
        }
      });

      if (!session) {
        throw new Error('Study session not found');
      }

      return {
        id: session.id,
        activity_name: session.activities[0]?.id ? "Vocabulary Quiz" : "Unknown",
        group_name: session.group.name,
        start_time: session.createdAt,
        end_time: session.endedAt,
        review_items_count: session.reviews.length
      };
    }),

  getSessionWords: publicProcedure
    .input(z.object({
      sessionId: z.number(),
      page: z.number().default(1),
      limit: z.number().default(100)
    }))
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const [items, total] = await Promise.all([
        ctx.prisma.wordReviewItem.findMany({
          where: { studySessionId: input.sessionId },
          skip,
          take: input.limit,
          include: {
            word: true
          }
        }),
        ctx.prisma.wordReviewItem.count({
          where: { studySessionId: input.sessionId }
        })
      ]);

      return {
        items: items.map(review => ({
          japanese: review.word.japanese,
          romaji: review.word.romaji,
          english: review.word.english,
          correct_count: review.correct ? 1 : 0,
          wrong_count: review.correct ? 0 : 1
        })),
        pagination: {
          current_page: input.page,
          total_pages: Math.ceil(total / input.limit),
          total_items: total,
          items_per_page: input.limit
        }
      };
    }),

  submitReview: publicProcedure
    .input(z.object({
      sessionId: z.number(),
      wordId: z.number(),
      correct: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.prisma.wordReviewItem.create({
        data: {
          wordId: input.wordId,
          studySessionId: input.sessionId,
          correct: input.correct
        }
      });

      return {
        success: true,
        word_id: review.wordId,
        study_session_id: review.studySessionId,
        correct: review.correct,
        created_at: review.createdAt
      };
    })
}); 