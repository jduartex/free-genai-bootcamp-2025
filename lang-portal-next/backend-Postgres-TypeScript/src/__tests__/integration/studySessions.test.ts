import { describe, it, expect, beforeAll } from 'vitest';
import { createContext } from '../../context';
import { appRouter } from '../../routers/appRouter';
import { setupTestData } from './setup';

describe('Study Sessions Router Integration', () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  it('should create and submit a word review', async () => {
    const caller = appRouter.createCaller(await createContext({} as any));
    
    // Create a study session first
    const session = await caller.studySessions.submitReview({
      sessionId: 1,
      wordId: testData.words[0].id,
      correct: true
    });

    expect(session).toMatchObject({
      success: true,
      word_id: testData.words[0].id,
      correct: true
    });
  });

  it('should list study sessions with pagination', async () => {
    const caller = appRouter.createCaller(await createContext({} as any));
    
    const result = await caller.studySessions.list({
      page: 1,
      limit: 10
    });

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('pagination');
    expect(result.pagination).toMatchObject({
      current_page: 1,
      items_per_page: 10
    });
  });
}); 