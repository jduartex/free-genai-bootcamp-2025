import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'vitest-mock-extended';
import { vi, beforeAll, afterAll } from 'vitest';

vi.mock('../prisma/client', () => ({
  prisma: mockDeep<PrismaClient>()
}));

beforeAll(() => {
  // Global test setup
});

afterAll(() => {
  // Global test cleanup
}); 