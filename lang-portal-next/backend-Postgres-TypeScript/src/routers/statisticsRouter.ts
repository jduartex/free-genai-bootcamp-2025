import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const statisticsRouter = router({
  dashboard: publicProcedure
    .query(async ({ ctx }) => {
      return {
        total_words_studied: await ctx.prisma.wordReviewItem.count(),
        total_available_words: await ctx.prisma.word.count()
      };
    }),

  quickStats: publicProcedure
    .query(async ({ ctx }) => {
      const reviews = await ctx.prisma.wordReviewItem.findMany();
      const correctReviews = reviews.filter(r => r.correct);
      const successRate = reviews.length > 0 
        ? (correctReviews.length / reviews.length) * 100 
        : 0;

      const totalSessions = await ctx.prisma.studySession.count();
      const totalActiveGroups = await ctx.prisma.group.count({
        where: {
          sessions: {
            some: {}
          }
        }
      });

      // Calculate study streak
      const sessions = await ctx.prisma.studySession.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          createdAt: true
        }
      });

      let streakDays = 0;
      if (sessions.length > 0) {
        const today = new Date();
        let currentDate = today;
        let currentStreak = 0;
        
        for (const session of sessions) {
          const sessionDate = new Date(session.createdAt);
          if (sessionDate.toDateString() === currentDate.toDateString()) {
            if (currentStreak === 0) currentStreak = 1;
          } else if (
            sessionDate.getTime() > currentDate.getTime() - 86400000 &&
            sessionDate.toDateString() !== currentDate.toDateString()
          ) {
            currentStreak++;
            currentDate = sessionDate;
          } else {
            break;
          }
        }
        streakDays = currentStreak;
      }

      return {
        success_rate: successRate,
        total_study_sessions: totalSessions,
        total_active_groups: totalActiveGroups,
        study_streak_days: streakDays
      };
    }),

  lastStudySession: publicProcedure
    .query(async ({ ctx }) => {
      const lastSession = await ctx.prisma.studySession.findFirst({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          group: true,
          activities: true
        }
      });

      if (!lastSession) {
        return null;
      }

      return {
        id: lastSession.id,
        group_id: lastSession.groupId,
        created_at: lastSession.createdAt,
        study_activity_id: lastSession.activities[0]?.id,
        group_name: lastSession.group.name
      };
    }),

  resetHistory: publicProcedure
    .mutation(async ({ ctx }) => {
      await ctx.prisma.wordReviewItem.deleteMany();
      await ctx.prisma.studyActivity.deleteMany();
      await ctx.prisma.studySession.deleteMany();

      return {
        success: true,
        message: "Study history has been reset"
      };
    }),

  fullReset: publicProcedure
    .mutation(async ({ ctx }) => {
      await ctx.prisma.wordReviewItem.deleteMany();
      await ctx.prisma.studyActivity.deleteMany();
      await ctx.prisma.studySession.deleteMany();
      await ctx.prisma.wordsGroups.deleteMany();
      await ctx.prisma.word.deleteMany();
      await ctx.prisma.group.deleteMany();

      return {
        success: true,
        message: "System has been fully reset"
      };
    })
}); 