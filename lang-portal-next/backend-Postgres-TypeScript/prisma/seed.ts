import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample words
  const word1 = await prisma.word.create({
    data: {
      japanese: 'こんにちは',
      romaji: 'konnichiwa',
      english: 'hello',
      parts: { type: 'greeting' }
    }
  });

  // Create sample group
  const group1 = await prisma.group.create({
    data: {
      name: 'Basic Greetings',
      words: {
        create: {
          word: { connect: { id: word1.id } }
        }
      }
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 