import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const groupsRouter = router({
  list: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(100)
    }))
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const [items, total] = await Promise.all([
        ctx.prisma.group.findMany({
          skip,
          take: input.limit,
          include: {
            words: true
          }
        }),
        ctx.prisma.group.count()
      ]);

      return {
        items: items.map(group => ({
          id: group.id,
          name: group.name,
          word_count: group.words.length
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
      const group = await ctx.prisma.group.findUnique({
        where: { id: input },
        include: {
          words: true
        }
      });

      if (!group) {
        throw new Error('Group not found');
      }

      return {
        id: group.id,
        name: group.name,
        stats: {
          total_word_count: group.words.length
        }
      };
    }),

  getGroupWords: publicProcedure
    .input(z.object({
      groupId: z.number(),
      page: z.number().default(1),
      limit: z.number().default(100)
    }))
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const group = await ctx.prisma.group.findUnique({
        where: { id: input.groupId },
        include: {
          words: {
            include: {
              word: {
                include: {
                  reviews: true
                }
              }
            },
            skip,
            take: input.limit
          }
        }
      });

      if (!group) {
        throw new Error('Group not found');
      }

      const total = await ctx.prisma.wordsGroups.count({
        where: { groupId: input.groupId }
      });

      return {
        items: group.words.map(({ word }) => ({
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
    })
}); 