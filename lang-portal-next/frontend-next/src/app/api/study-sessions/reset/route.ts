import { NextResponse } from 'next/server';

export async function POST() {
  // In a real application, this would clear the study sessions from the database
  // For now, we'll just return a success response
  return NextResponse.json({ message: 'Study history cleared successfully' });
}
