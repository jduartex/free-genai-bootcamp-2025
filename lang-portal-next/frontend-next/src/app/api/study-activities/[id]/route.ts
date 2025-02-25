import { NextRequest, NextResponse } from 'next/server';

const activities = {
  '1': {
    id: '1',
    name: 'Kanji Writing Practice',
    type: 'writing',
    difficulty: 'beginner',
    description: 'Practice writing basic kanji characters with proper stroke order.',
    instructions: '1. Watch the stroke order animation\n2. Practice writing each character\n3. Submit your work for review'
  },
  '2': {
    id: '2',
    name: 'Vocabulary Quiz',
    type: 'quiz',
    difficulty: 'intermediate',
    description: 'Test your knowledge of common Japanese vocabulary words.',
    instructions: '1. Review the vocabulary list\n2. Complete the multiple choice questions\n3. Check your score'
  },
  '3': {
    id: '3',
    name: 'Reading Comprehension',
    type: 'reading',
    difficulty: 'advanced',
    description: 'Read and understand complex Japanese texts.',
    instructions: '1. Read the provided text\n2. Answer comprehension questions\n3. Discuss the main themes'
  }
};

/**
 * Handles GET requests for retrieving a study activity by its unique ID.
 *
 * Asynchronously looks up the activity corresponding to the provided ID from the predefined activities collection.
 * If the activity exists, it returns the activity data as a JSON response; otherwise, it returns a 404 response with an "Activity not found" message.
 *
 * @param id - The unique identifier extracted from the URL parameters for the desired study activity.
 * @returns A NextResponse containing the activity data in JSON format if found, or a 404 error message if not.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = await params.id;
  const activity = activities[id];
  
  if (!activity) {
    return new NextResponse('Activity not found', { status: 404 });
  }

  return NextResponse.json(activity);
}
