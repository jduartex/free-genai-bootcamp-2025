import { createContext } from '../../context';

describe('Dashboard Router', () => {
  // ...existing code...
  test('GET /api/dashboard/study_progress', async () => {
    const ctx = await createContext({ req: {}, res: {} } as any);
    
    // Check if the table exists
    const tableExists = await ctx.prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'dashboard' 
        AND table_name = 'study_progress'
      );
    `;
    
    if (!tableExists[0]?.exists) {
      throw new Error('Table "dashboard.study_progress" does not exist');
    }

    const response = await ctx.prisma.$queryRaw`SELECT * FROM dashboard.study_progress`;
    expect(response).toHaveProperty('total_words_studied');
    expect(response).toHaveProperty('total_available_words');
  });
});
