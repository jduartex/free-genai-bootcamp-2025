import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/api/study-activities`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching study activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch study activities' },
      { status: 500 }
    );
  }
}
