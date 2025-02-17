import { PrismaClient } from '@prisma/client';
import { sampleWords, sampleGroups } from '../fixtures/wordFixtures';

const prisma = new PrismaClient();

export const setupTestData = async () => {
  // Clear existing data
  await prisma.wordReviewItem.deleteMany();
  await prisma.studyActivity.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.wordsGroups.deleteMany();
  await prisma.word.deleteMany();
  await prisma.group.deleteMany();

  // Create test words
  const words = await Promise.all(
    sampleWords.map(word => 
      prisma.word.create({
        data: word
      })
    )
  );

  // Create test groups with words
  const group = await prisma.group.create({
    data: {
      name: sampleGroups[0].name,
      words: {
        create: words.map(word => ({
          word: { connect: { id: word.id } }
        }))
      }
    }
  });

  return { words, group };
}; 