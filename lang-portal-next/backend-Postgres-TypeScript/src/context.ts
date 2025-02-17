import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { prisma } from './prisma/client';
import { WordService } from './services/wordService';
import { GroupService } from './services/groupService';
import { StudySessionService } from './services/studySessionService';
import { StatisticsService } from './services/statisticsService';

export const createContext = ({ req, res }: CreateExpressContextOptions) => {
  return {
    prisma,
    services: {
      words: new WordService(prisma),
      groups: new GroupService(prisma),
      studySessions: new StudySessionService(prisma),
      statistics: new StatisticsService(prisma)
    },
    req,
    res,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>; 