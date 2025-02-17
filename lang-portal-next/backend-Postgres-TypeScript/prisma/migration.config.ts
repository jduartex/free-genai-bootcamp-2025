import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add any post-migration tasks here
  console.log('Running post-migration tasks...');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 