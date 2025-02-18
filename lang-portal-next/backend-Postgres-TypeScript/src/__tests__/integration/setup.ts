import { PrismaClient } from '@prisma/client';
import { getTestClient } from '../../prisma/testClient';

let prisma: PrismaClient = new PrismaClient();

export async function setupTestData() {
  prisma = await getTestClient();
  
  try {
    // First ensure database is completely clean
    await prisma.$transaction([
      prisma.wordReviewItem.deleteMany(),
      prisma.studyActivity.deleteMany(),
      prisma.wordGroup.deleteMany(),
      prisma.studySession.deleteMany(), // Ensure this is before deleting words and groups
      prisma.word.deleteMany(),
      prisma.group.deleteMany(),
    ]);

    // Then create test data in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create group
      const group = await tx.group.create({
        data: { name: 'Basic Greetings' }
      });

      // Create exactly 2 words
      const word1 = await tx.word.create({
        data: {
          japanese: 'こんにちは',
          romaji: 'konnichiwa',
          english: 'hello',
          parts: { type: 'greeting' }
        }
      });

      const word2 = await tx.word.create({
        data: {
          japanese: 'さようなら',
          romaji: 'sayounara',
          english: 'goodbye',
          parts: { type: 'greeting' }
        }
      });

      // Link words to group
      await tx.wordGroup.createMany({
        data: [
          { wordId: word1.id, groupId: group.id },
          { wordId: word2.id, groupId: group.id }
        ]
      });

      // Create study session with one review
      const session = await tx.studySession.create({
        data: {
          groupId: group.id,
          reviews: {
            create: {
              wordId: word1.id,
              correct: true
            }
          }
        },
        include: { reviews: true }
      });

      return {
        words: [word1, word2],
        groups: [group],
        sessions: [session]
      };
    });

    return result;
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
}

export async function cleanupTestData() {
  if (prisma) {
    try {
      // Clean up in same order as setup
      await prisma.$transaction([
        prisma.wordReviewItem.deleteMany(),
        prisma.studyActivity.deleteMany(),
        prisma.wordGroup.deleteMany(),
        prisma.studySession.deleteMany(), // Ensure this is before deleting words and groups
        prisma.word.deleteMany(),
        prisma.group.deleteMany(),
      ]);
    } finally {
      await prisma.$disconnect();
    }
  }
}