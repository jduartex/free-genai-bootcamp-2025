import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const wordsRouter = router({
  list: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(100)
    }))
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const [items, total] = await Promise.all([
        ctx.prisma.word.findMany({
          skip,
          take: input.limit,
          include: {
            reviews: true
          }
        }),
        ctx.prisma.word.count()
      ]);

      return {
        items: items.map(word => ({
          japanese: word.japanese,
          romaji: word.romaji,
          english: word.english,
          correct_count: word.reviews.filter(r => r.correct).length,
          wrong_count: word.reviews.filter(r => !r.correct).length
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
      const word = await ctx.prisma.word.findUnique({
        where: { id: input },
        include: {
          reviews: true,
          groups: {
            include: {
              group: true
            }
          }
        }
      });

      if (!word) {
        throw new Error('Word not found');
      }

      return {
        japanese: word.japanese,
        romaji: word.romaji,
        english: word.english,
        stats: {
          correct_count: word.reviews.filter(r => r.correct).length,
          wrong_count: word.reviews.filter(r => !r.correct).length
        },
        groups: word.groups.map(g => ({
          id: g.group.id,
          name: g.group.name
        }))
      };
    })
}); 