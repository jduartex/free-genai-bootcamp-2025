import { NextResponse } from 'next/server';

export async function GET() {
  // Mock study activities data
  const activities = [
    {
      id: '1',
      name: 'Flashcards',
      type: 'Cards',
      difficulty: 'Beginner',
      description: 'Practice vocabulary with interactive flashcards',
      instructions: 'You will be shown a word in your target language. Try to recall its meaning, then flip the card to check your answer. Mark whether you got it right or wrong to track your progress.'
    },
    {
      id: '2',
      name: 'Multiple Choice Quiz',
      type: 'Quiz',
      difficulty: 'Intermediate',
      description: 'Test your knowledge with multiple choice questions',
      instructions: 'Select the correct translation for each word from the given options. Each question has only one correct answer.'
    },
    {
      id: '3',
      name: 'Word Matching',
      type: 'Game',
      difficulty: 'Advanced',
      description: 'Match pairs of words in a memory-style game',
      instructions: 'Find matching pairs of words and their translations. Try to complete the matching with as few attempts as possible.'
    }
  ];

  return NextResponse.json(activities);
}
