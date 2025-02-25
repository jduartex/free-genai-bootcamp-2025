import { NextResponse } from 'next/server';

/**
 * Handles HTTP GET requests to retrieve recent study sessions.
 *
 * Extracts the `type` parameter from the request's URL (defaulting to `'all'` if not provided)
 * and forwards the request to a backend API endpoint to fetch session data. Returns the API response as JSON.
 * If the backend response is not successful or any error occurs, logs the error and returns a JSON error response with a 500 status.
 *
 * @param request - The incoming HTTP GET request.
 * @returns A JSON response containing the session data or an error message.
 */
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
