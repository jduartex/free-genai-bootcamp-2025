import { PrismaClient } from '@prisma/client';

export class WordsService {
  constructor(private prisma: PrismaClient) {}

  async listWords(page: number = 1, limit: number = 100) {
    const skip = (page - 1) * limit;
    
    const [items, total] = await this.prisma.$transaction([
      this.prisma.word.findMany({
        skip,
        take: limit,
        include: {
          reviews: true,
          groups: {
            include: {
              group: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prisma.word.count()
    ]);

    return {
      items,
      total,
      page,
      limit
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
        },
        // parts: true, // Ensure parts are included
      }
    });

    if (!word) {
      throw new Error('Word not found');
    }

    return word;
  }

  async createWord(data: {
    japanese: string;
    romaji: string;
    english: string;
    parts?: any;
    groupId?: number;
  }) {
    const word = await this.prisma.word.create({
      data: {
        japanese: data.japanese,
        romaji: data.romaji,
        english: data.english,
        parts: data.parts || {},
        ...(data.groupId ? {
          groups: {
            create: {
              group: {
                connect: {
                  id: data.groupId
                }
              }
            }
          }
        } : {})
      },
      include: {
        groups: {
          include: {
            group: true
          }
        }
      }
    });

    return word;
  }
}