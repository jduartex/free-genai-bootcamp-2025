import { PrismaClient } from '@prisma/client';

const testClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/words_test"
    }
  },
  log: ['query', 'error', 'warn']
});

// Ensure client is connected before use
const getTestClient = async () => {
  try {
    await testClient.$connect();
    return testClient;
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
};

export { getTestClient }; 