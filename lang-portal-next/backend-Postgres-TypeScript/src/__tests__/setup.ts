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
      testClient.word.deleteMany(),
      testClient.group.deleteMany(),
    ]);
    
    // Add test data
    const group = await testClient.group.create({
      data: {
        name: 'Test Group',
      },
    });

    const word = await testClient.word.create({
      data: {
        japanese: 'テスト',
        romaji: 'tesuto',
        english: 'test',
        parts: { type: 'noun' },
      },
    });

    const wordGroup = await testClient.wordGroup.create({
      data: {
        wordId: word.id,
        groupId: group.id,
      },
    });

    const studySession = await testClient.studySession.create({
      data: {
        groupId: group.id,
        activities: {
          create: {
            groupId: group.id,
          },
        },
        reviews: {
          create: {
            wordId: word.id,
            correct: true,
          },
        },
      },
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
        testClient.word.deleteMany(),
        testClient.group.deleteMany(),
      ]);
    } finally {
      await testClient.$disconnect();
    }
  }
}); 