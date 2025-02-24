import { PrismaClient } from '@prisma/client';
import { isConsecutiveDay } from '../utils/dateUtils';

export class StatisticsService {
  constructor(private prisma: PrismaClient) {}

  async getDashboardStats() {
    return {
      total_words_studied: await this.prisma.wordReviewItem.count(),
      total_available_words: await this.prisma.word.count()
    };
  }

  async getQuickStats() {
    const reviews = await this.prisma.wordReviewItem.findMany();
    const correctReviews = reviews.filter(r => r.correct);
    const successRate = reviews.length > 0 
      ? (correctReviews.length / reviews.length) * 100 
      : 0;

    const totalSessions = await this.prisma.studySession.count();
    const totalActiveGroups = await this.prisma.group.count({
      where: {
        sessions: {
          some: {}
        }
      }
    });

    const sessions = await this.prisma.studySession.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        createdAt: true
      }
    });

    let streakDays = this.calculateStreak(sessions.map(s => s.createdAt));

    return {
      success_rate: successRate,
      total_study_sessions: totalSessions,
      total_active_groups: totalActiveGroups,
      study_streak_days: streakDays
    };
  }

  private calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;

    let currentStreak = 1;
    let currentDate = dates[0];

    for (let i = 1; i < dates.length; i++) {
      if (isConsecutiveDay(currentDate, dates[i])) {
        currentStreak++;
        currentDate = dates[i];
      } else {
        break;
      }
    }

    return currentStreak;
  }

  async resetHistory() {
    await this.prisma.wordReviewItem.deleteMany();
    await this.prisma.studyActivity.deleteMany();
    await this.prisma.studySession.deleteMany();

    return {
      success: true,
      message: "Study history has been reset"
    };
  }

  async fullReset() {
    await this.prisma.wordReviewItem.deleteMany();
    await this.prisma.studyActivity.deleteMany();
    await this.prisma.studySession.deleteMany();
    await this.prisma.wordGroup.deleteMany();
    await this.prisma.word.deleteMany();
    await this.prisma.group.deleteMany();

    return {
      success: true,
      message: "System has been fully reset"
    };
  }

  async getLastStudySession() {
    const session = await this.prisma.studySession.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        group: true,
      },
    });

    if (!session) {
      throw new Error('No study sessions found');
    }

    return {
      group_id: session.groupId,
      created_at: session.createdAt,
    };
  }
}