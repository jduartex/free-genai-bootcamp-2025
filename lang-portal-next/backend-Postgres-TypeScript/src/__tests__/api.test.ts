import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from '../routers/appRouter';
import { createContext } from '../context';
import { inferProcedureInput } from '@trpc/server';
import { setupTestData, cleanupTestData } from './integration/setup';

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

describe('Words API', () => {
  it('should list words', async () => {
    const result = await caller.words.list({ page: 1, limit: 10 });
    
    expect(result).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBe(2); // Adjust to match the expected number of items
    expect(result.pagination.total_items).toBe(2); // Adjust to match the expected total items
    expect(result.items[0]).toHaveProperty('japanese');
  });

  it('should get word by id', async () => {
    const wordId = testData.words[0].id;
    const result = await caller.words.getById(wordId);
    
    expect(result).toBeDefined();
    expect(result.japanese).toBeDefined();
    expect(result.japanese).toBe('こんにちは');
  });
});

describe('Groups API', () => {
  it('should list groups', async () => {
    const input: inferProcedureInput<typeof appRouter.groups.list> = {
      page: 1,
      limit: 10
    };
    
    const result = await caller.groups.list(input);
    expect(result).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });
});

describe('Study Sessions API', () => {
  it('should list study sessions', async () => {
    const input: inferProcedureInput<typeof appRouter.studySessions.list> = {
      page: 1,
      limit: 10
    };
    
    const result = await caller.studySessions.list(input);
    expect(result).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });
});