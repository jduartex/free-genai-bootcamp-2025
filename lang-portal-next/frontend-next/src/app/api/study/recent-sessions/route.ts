import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/study/recent-sessions?` +
      new URLSearchParams({ type: type || 'all' })
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching recent sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent sessions' },
      { status: 500 }
    );
  }
}
