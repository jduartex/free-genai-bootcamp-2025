import { describe, it, expect, beforeAll } from 'vitest';
import { createContext } from '../../context';
import { appRouter } from '../../routers/appRouter';
import { setupTestData } from './setup';

describe('Words Router Integration', () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  it('should list words with pagination', async () => {
    const caller = appRouter.createCaller(await createContext({} as any));
    
    const result = await caller.words.list({
      page: 1,
      limit: 10
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      japanese: 'こんにちは',
      romaji: 'konnichiwa',
      english: 'hello'
    });
  });

  it('should get word by id with stats', async () => {
    const caller = appRouter.createCaller(await createContext({} as any));
    
    const result = await caller.words.getById(testData.words[0].id);

    expect(result).toMatchObject({
      japanese: 'こんにちは',
      romaji: 'konnichiwa',
      english: 'hello',
      stats: {
        correct_count: 0,
        wrong_count: 0
      }
    });
  });
}); 