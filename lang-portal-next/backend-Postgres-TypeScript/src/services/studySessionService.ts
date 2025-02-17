import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errorHandler';

export class StudySessionService {
  constructor(private prisma: PrismaClient) {}

  async createReview(sessionId: number, wordId: number, correct: boolean) {
    const review = await this.prisma.wordReviewItem.create({
      data: {
        wordId,
        studySessionId: sessionId,
        correct
      }
    });

    return {
      success: true,
      word_id: review.wordId,
      study_session_id: review.studySessionId,
      correct: review.correct,
      created_at: review.createdAt
    };
  }

  async listSessions(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.studySession.findMany({
        skip,
        take: limit,
        include: {
          group: true,
          activities: true,
          reviews: true
        }
      }),
      this.prisma.studySession.count()
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
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    };
  }

  async getSessionById(id: number) {
    const session = await this.prisma.studySession.findUnique({
      where: { id },
      include: {
        group: true,
        activities: true,
        reviews: true
      }
    });

    if (!session) {
      throw new AppError('Study session not found', 404);
    }

    return {
      id: session.id,
      activity_name: session.activities[0]?.id ? "Vocabulary Quiz" : "Unknown",
      group_name: session.group.name,
      start_time: session.createdAt,
      end_time: session.endedAt,
      review_items_count: session.reviews.length
    };
  }

  async getSessionWords(sessionId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.wordReviewItem.findMany({
        where: { studySessionId: sessionId },
        skip,
        take: limit,
        include: {
          word: true
        }
      }),
      this.prisma.wordReviewItem.count({
        where: { studySessionId: sessionId }
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
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    };
  }
} 