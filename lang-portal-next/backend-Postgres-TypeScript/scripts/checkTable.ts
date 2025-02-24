import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTable() {
  const tableExists = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'dashboard' 
      AND table_name = 'study_progress'
    );
  `;
  
  if (tableExists[0]?.exists) {
    console.log('Table "dashboard.study_progress" exists.');
  } else {
    console.log('Table "dashboard.study_progress" does not exist.');
  }

  await prisma.$disconnect();
}

checkTable().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
