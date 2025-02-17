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

  async getGroupWords(groupId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
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
          take: limit
        }
      }
    });

    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const total = await this.prisma.wordsGroups.count({
      where: { groupId }
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
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    };
  }
} 