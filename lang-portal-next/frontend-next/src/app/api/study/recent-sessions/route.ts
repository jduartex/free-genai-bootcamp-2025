import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Check if we're requesting all sessions or just the most recent one
  const url = new URL(request.url);
  const type = url.searchParams.get('type');

  // Get current date for timestamps
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // Mock recent study sessions data
  const recentSessions = [
    {
      id: '1',
      created_at: now.toISOString(),
      activity_name: 'Flashcards',
      group_id: '1',
      correct_count: 17,
      wrong_count: 3,
      duration: 15,
      wordsStudied: 20,
      accuracy: 0.85
    },
    {
      id: '2',
      created_at: yesterday.toISOString(),
      activity_name: 'Multiple Choice',
      group_id: '2',
      correct_count: 22,
      wrong_count: 3,
      duration: 20,
      wordsStudied: 25,
      accuracy: 0.90
    },
    {
      id: '3',
      created_at: twoDaysAgo.toISOString(),
      activity_name: 'Matching Game',
      group_id: '3',
      correct_count: 12,
      wrong_count: 3,
      duration: 10,
      wordsStudied: 15,
      accuracy: 0.80
    }
  ];

  // Return either all sessions or just the most recent one
  return NextResponse.json(type === 'recent' ? recentSessions[0] : recentSessions);
}
