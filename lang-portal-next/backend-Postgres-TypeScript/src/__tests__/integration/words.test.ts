import { describe, it, expect, beforeAll } from 'vitest';
import { createContext } from '../../context';
import { setupTestData } from './setup';
import { initTRPC, inferRouterInputs, inferRouterOutputs } from '@trpc/server';

// Ensure the wordsRouter is correctly imported
import { wordsRouter } from '../../routers/wordsRouter';

const t = initTRPC.create();

const appRouter = t.router({
  words: wordsRouter,
});

type AppRouter = typeof appRouter;
type Caller = ReturnType<typeof appRouter.createCaller>;

describe('Words Router Integration', () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;
  let caller: Caller;

  beforeAll(async () => {
    testData = await setupTestData();
    caller = appRouter.createCaller(await createContext({ req: {}, res: {} } as any));
  });

  it('should list words with pagination', async () => {
    const result = await caller.words.list({
      page: 1,
      limit: 10
    });

    expect(result.items).toHaveLength(2); // Adjust to match the expected number of items
    expect(result.pagination.total_items).toBe(2); // Adjust to match the expected total items
    expect(result.items[0]).toHaveProperty('japanese');
  });

  it('should get word by id with stats', async () => {
    const word = testData.words[0];
    const result = await caller.words.getById(word.id as number);

    expect(result).toHaveProperty('japanese', word.japanese);
    expect(result).toHaveProperty('romaji', word.romaji);
    expect(result).toHaveProperty('english', word.english);
    if (word.parts) {
      expect(result).toHaveProperty('parts', word.parts);
    }
    expect(result).toHaveProperty('stats');
  });
});