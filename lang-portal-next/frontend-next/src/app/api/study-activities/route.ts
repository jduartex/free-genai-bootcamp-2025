import { NextResponse } from 'next/server';

/**
 * Handles an HTTP GET request to retrieve study activities.
 *
 * Constructs the backend API URL using the BACKEND_URL environment variable and requests data from the /api/study-activities endpoint. If the response is successful, it returns the parsed JSON data. If the request fails or the response is not ok, logs the error and returns a JSON response with an error message and a 500 status code.
 *
 * @returns A response object containing either the study activities data or an error message with a 500 status code.
 */
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
