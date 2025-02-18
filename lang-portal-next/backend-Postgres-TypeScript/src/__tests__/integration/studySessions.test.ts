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
    
    const session = await caller.studySessions.submitReview({
      sessionId: testData.sessions[0].id,
      wordId: testData.words[0].id,
      correct: true
    });

    expect(session).toBeDefined();
    expect(session.reviews).toBeDefined();
    expect(session.reviews.length).toBeGreaterThan(0);
    expect(session.reviews[0].correct).toBe(true);
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

  it('should list words by study session id with pagination', async () => {
    const caller = appRouter.createCaller(await createContext({} as any));
    
    const result = await caller.studySessions.getWordsByStudySessionId({
      id: testData.sessions[0].id,
      page: 1,
      limit: 10
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      japanese: 'こんにちは',
      romaji: 'konnichiwa',
      english: 'hello',
      correct_count: 1,
      wrong_count: 0,
    });
    expect(result.items[1]).toMatchObject({
      japanese: 'さようなら',
      romaji: 'sayounara',
      english: 'goodbye',
      correct_count: 0,
      wrong_count: 1,
    });
    expect(result.pagination.total_items).toBe(2);
  });
});