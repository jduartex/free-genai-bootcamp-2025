import { describe, it, expect, beforeAll } from 'vitest';
import { createContext } from '../../context';
import { appRouter } from '../../routers/appRouter';
import { setupTestData } from './setup';

describe('Statistics Router Integration', () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  it('should get dashboard statistics', async () => {
    const caller = appRouter.createCaller(await createContext({} as any));
    
    const result = await caller.statistics.getDashboard();

    expect(result).toHaveProperty('total_words_studied');
    expect(result).toHaveProperty('total_available_words');
    expect(result.total_available_words).toBe(2); // Exactly 2 words from setup
    expect(result.total_words_studied).toBe(1); // Exactly 1 review from setup
  });

  it('should get quick stats', async () => {
    const caller = appRouter.createCaller(await createContext({} as any));
    
    const result = await caller.statistics.quickStats();

    expect(result).toMatchObject({
      success_rate: expect.any(Number),
      total_study_sessions: expect.any(Number),
      total_active_groups: expect.any(Number),
      study_streak_days: expect.any(Number)
    });
  });

  it('should get last study session', async () => {
    const caller = appRouter.createCaller(await createContext({} as any));
    
    const result = await caller.statistics.lastStudySession();

    // Might be null if no sessions yet
    if (result) {
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('group_id');
      expect(result).toHaveProperty('created_at');
    }
  });

  it('should reset history', async () => {
    const caller = appRouter.createCaller(await createContext({} as any));
    
    const result = await caller.statistics.resetHistory();

    expect(result).toMatchObject({
      success: true,
      message: "Study history has been reset"
    });
  });
}); 