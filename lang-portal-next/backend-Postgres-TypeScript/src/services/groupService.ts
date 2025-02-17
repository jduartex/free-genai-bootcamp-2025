import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errorHandler';

export class GroupService {
  constructor(private prisma: PrismaClient) {}

  async listGroups(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.group.findMany({
        skip,
        take: limit,
        include: {
          words: true
        }
      }),
      this.prisma.group.count()
    ]);

    return {
      items: items.map(group => ({
        id: group.id,
        name: group.name,
        word_count: group.words.length
      })),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    };
  }

  async getGroupById(id: number) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        words: true
      }
    });

    if (!group) {
      throw new AppError('Group not found', 404);
    }

    return {
      id: group.id,
      name: group.name,
      stats: {
        total_word_count: group.words.length
      }
    };
  }

  async getGroupWords(groupId: number) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error('Group not found');
    }

    const total = await this.prisma.wordGroup.count({
      where: { groupId }
    });

    const words = await this.prisma.wordGroup.findMany({
      where: { groupId },
      include: {
        word: true
      }
    });

    return {
      items: words.map(wg => wg.word),
      total
    };
  }
} 