import { describe, it, expect, beforeAll } from 'vitest';
import { createContext } from '../../context';
import { setupTestData } from './setup';
import { initTRPC, inferRouterInputs, inferRouterOutputs } from '@trpc/server';

// Ensure the statisticsRouter is correctly imported
import { statisticsRouter } from '../../routers/statisticsRouter';

const t = initTRPC.create();

const appRouter = t.router({
  statistics: statisticsRouter,
});

type AppRouter = typeof appRouter;
type Caller = ReturnType<typeof appRouter.createCaller>;

describe('Statistics Router Integration', () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;
  let caller: Caller;

  beforeAll(async () => {
    testData = await setupTestData();
    caller = appRouter.createCaller(await createContext({ req: {}, res: {} } as any));
  });

  it('should get dashboard statistics', async () => {
    const result = await caller.statistics.getDashboard();

    expect(result).toHaveProperty('total_words_studied');
    expect(result).toHaveProperty('total_available_words');
    expect(result.total_available_words).toBe(2); // Exactly 2 words from setup
    expect(result.total_words_studied).toBe(1); // Exactly 1 review from setup
  });

  it('should get quick stats', async () => {
    const result = await caller.statistics.quickStats();

    expect(result).toMatchObject({
      success_rate: expect.any(Number),
      total_study_sessions: expect.any(Number),
      total_active_groups: expect.any(Number),
      study_streak_days: expect.any(Number)
    });
  });

  it('should get last study session', async () => {
    const result = await caller.statistics.lastStudySession();

    expect(result).toHaveProperty('group_id');
    expect(result).toHaveProperty('created_at');
  });

  it('should reset history', async () => {
    const result = await caller.statistics.resetHistory();

    expect(result).toMatchObject({
      success: true,
    });
  });
});