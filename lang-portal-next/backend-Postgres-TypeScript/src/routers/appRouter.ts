import { router } from '../trpc';
import { wordsRouter } from './wordsRouter';
import { groupsRouter } from './groupsRouter';
import { studySessionsRouter } from './studySessionsRouter';
import { statisticsRouter } from './statisticsRouter';

export const appRouter = router({
  words: wordsRouter,
  groups: groupsRouter,
  studySessions: studySessionsRouter,
  statistics: statisticsRouter,
});