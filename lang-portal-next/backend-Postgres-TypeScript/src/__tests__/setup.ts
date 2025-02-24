import { beforeAll, afterAll } from 'vitest';
import { getTestClient } from '../prisma/testClient';
import { PrismaClient } from '@prisma/client';

let testClient: PrismaClient;

beforeAll(async () => {
  // Setup test database
  try {
    testClient = await getTestClient();
    
    // Clean existing data in correct order (following foreign key constraints)
    await testClient.$transaction([
      testClient.wordReviewItem.deleteMany(),
      testClient.studyActivity.deleteMany(),
      testClient.studySession.deleteMany(),
      testClient.wordGroup.deleteMany(),
      testClient.wordReviewItem.deleteMany(), // Add this line to delete wordReviewItem first
      testClient.word.deleteMany(),
      testClient.group.deleteMany(),
    ]);
    
    // Add test data
    const { group, words, wordGroups, studySession } = await testClient.$transaction(async (prisma) => {
      const group = await prisma.group.create({
        data: {
          name: 'Test Group',
        },
      });

      const words = await Promise.all([
        prisma.word.create({
          data: {
            japanese: 'テスト1',
            romaji: 'tesuto1',
            english: 'test1',
            parts: { type: 'noun' },
          },
        }),
        prisma.word.create({
          data: {
            japanese: 'テスト2',
            romaji: 'tesuto2',
            english: 'test2',
            parts: { type: 'noun' },
          },
        }),
      ]);

      const wordGroups = await Promise.all(
        words.map(word =>
          prisma.wordGroup.create({
            data: {
              wordId: word.id,
              groupId: group.id,
            },
          })
        )
      );

      interface RetryFunction {
        (): Promise<any>;
      }

      const retry = async (fn: RetryFunction, retries: number = 5): Promise<any> => {
        for (let i = 0; i < retries; i++) {
          try {
            return await fn();
          } catch (error: any) {
            if (error.code === '40P01' && i < retries - 1) {
              // Deadlock detected, retry
              continue;
            }
            throw error;
          }
        }
      };

      const studySession = await retry(() =>
        prisma.studySession.create({
          data: {
            groupId: group.id,
            activities: {
              create: {
                groupId: group.id,
              },
            },
            reviews: {
              create: words.map(word => ({
                wordId: word.id,
                correct: true,
              })),
            },
          }
        })
      );

      return { group, words, wordGroups, studySession };
    });

  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  // Cleanup
  if (testClient) {
    try {
      // Clean up in reverse order of creation (following foreign key constraints)
      await testClient.$transaction([
        testClient.wordReviewItem.deleteMany(),
        testClient.studyActivity.deleteMany(),
        testClient.studySession.deleteMany(),
        testClient.wordGroup.deleteMany(),
        testClient.wordReviewItem.deleteMany(), // Add this line to delete wordReviewItems first
        testClient.word.deleteMany(),
        testClient.group.deleteMany(),
      ]);
    } finally {
      await testClient.$disconnect();
    }
  }
});