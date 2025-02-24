import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from '../../routers/appRouter';
import { createContext } from '../../context';
import { setupTestData, cleanupTestData } from './setup';

let caller: ReturnType<typeof appRouter.createCaller>;
let testData: Awaited<ReturnType<typeof setupTestData>>;

beforeAll(async () => {
  // First setup test data
  testData = await setupTestData();
  // Then create caller
  const ctx = await createContext({} as any);
  caller = appRouter.createCaller(ctx);
});

afterAll(async () => {
  await cleanupTestData();
});

describe('Study Sessions Router Integration', () => {
  it('should create and submit a word review', async () => {
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
    const result = await caller.studySessions.getWordsByStudySessionId({
      id: testData.sessions[0].id,
      page: 1,
      limit: 10
    });

    expect(result.items).toHaveLength(testData.sessions.length); // Adjust to match the expected number of items
    expect(result.items[0]).toMatchObject({
      groupId: testData.groups[0].id,
      reviews: expect.arrayContaining([
        expect.objectContaining({
          wordId: testData.words[0].id,
          correct: true
        })
      ])
    });
  });
});