import { router } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '../prisma/client';

export const dashboardRouter = router()
  // ...existing code...
  .query('study_progress', {
    async resolve() {
      const totalWordsStudied = await prisma.wordReviewItem.count();
      const totalAvailableWords = await prisma.word.count();
      return {
        total_words_studied: totalWordsStudied,
        total_available_words: totalAvailableWords,
      };
    },
  });
