import { NextResponse } from 'next/server';

/**
 * Handles an HTTP GET request by fetching study statistics from the backend API.
 *
 * The function requests data from the study stats endpoint derived from the BACKEND_URL environment variable.
 * On a successful response, it returns the parsed JSON data. If the request fails or returns an unsuccessful status,
 * the error is logged and a JSON response with an appropriate error message and a 500 status code is returned.
 *
 * @returns A NextResponse object containing either the study statistics or an error message when a failure occurs.
 */
export async function GET() {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/api/study/stats`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching study stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch study stats' },
      { status: 500 }
    );
  }
}
