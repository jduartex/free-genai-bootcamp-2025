import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

/**
 * @swagger
 * /api/trpc/groups.list:
 *   get:
 *     summary: Get a list of groups
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
 *         description: List of groups with pagination
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
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       word_count:
 *                         type: integer
 */

/**
 * @swagger
 * /api/trpc/groups.getById:
 *   get:
 *     summary: Get a group by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group details
 *       404:
 *         description: Group not found
 */
export const groupsRouter = router({
  list: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(100)
    }))
    .query(async ({ ctx, input }) => {
      return ctx.services.groups.listGroups(input.page, input.limit);
    }),

  getById: publicProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      return ctx.services.groups.getGroupById(input);
    }),

  getGroupWords: publicProcedure
    .input(z.object({
      groupId: z.number(),
      page: z.number().default(1),
      limit: z.number().default(100)
    }))
    .query(async ({ ctx, input }) => {
      return ctx.services.groups.getGroupWords(
        input.groupId,
        input.page,
        input.limit
      );
    })
}); 