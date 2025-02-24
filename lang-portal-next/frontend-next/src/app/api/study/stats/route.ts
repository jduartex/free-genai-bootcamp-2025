import { NextResponse } from 'next/server';

export async function GET() {
  // Mock study stats data
  const stats = {
    totalMinutes: 120,
    totalSessions: 15,
    streakDays: 5,
    wordsLearned: 75
  };

  return NextResponse.json(stats);
}
