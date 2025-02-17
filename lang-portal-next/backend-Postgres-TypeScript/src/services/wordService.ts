import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errorHandler';

export class WordService {
  constructor(private prisma: PrismaClient) {}

  async listWords(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.word.findMany({
        skip,
        take: limit,
        include: {
          reviews: true
        }
      }),
      this.prisma.word.count()
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
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    };
  }

  async getWordById(id: number) {
    const word = await this.prisma.word.findUnique({
      where: { id },
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
      throw new AppError('Word not found', 404);
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
  }
} 