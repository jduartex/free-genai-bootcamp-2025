import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createContext } from '../../context';
import { appRouter } from '../../routers/appRouter';
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

describe('Words Router Integration', () => {
  it('should list words with pagination', async () => {
    const result = await caller.words.list({
      page: 1,
      limit: 10
    });

    expect(result.items).toHaveLength(testData.words.length); // Adjust to match the expected number of items
    expect(result.items[0]).toMatchObject({
      japanese: 'こんにちは',
      romaji: 'konnichiwa',
      english: 'hello'
    });
  });

  it('should get word by id with stats', async () => {
    const result = await caller.words.getById(testData.words[0].id);

    expect(result).toMatchObject({
      japanese: 'こんにちは',
      romaji: 'konnichiwa',
      english: 'hello',
      stats: {
        correct_count: 1,
        wrong_count: 0,
      },
    });
  });
});