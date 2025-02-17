import { describe, it, expect, beforeAll } from 'vitest';
import { createContext } from '../../context';
import { appRouter } from '../../routers/appRouter';
import { setupTestData } from './setup';

describe('Groups Router Integration', () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  it('should list groups with word counts', async () => {
    const caller = appRouter.createCaller(await createContext({} as any));
    
    const result = await caller.groups.list({
      page: 1,
      limit: 10
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      name: 'Basic Greetings',
      word_count: 2
    });
  });

  it('should get group words', async () => {
    const caller = appRouter.createCaller(await createContext({} as any));
    
    const result = await caller.groups.getGroupWords({
      groupId: testData.groups[0].id,
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
}); 