import { NextResponse } from 'next/server';

/**
 * Retrieves the backend URL from environment variables and validates its presence.
 *
 * Checks for the existence of the BACKEND_URL environment variable and throws an error if it is not set.
 *
 * @returns The backend URL.
 * @throws {Error} If the BACKEND_URL environment variable is not set.
 */
function validateBackendUrl() {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error('BACKEND_URL environment variable is not set');
  }
  return backendUrl;
}

/**
 * Handles GET requests to retrieve a list of groups from the backend service.
 *
 * Validates the backend URL from the environment, extracts query parameters for pagination and sorting (defaulting to page 1, sorting by name in ascending order), and forwards the request to the backend API. The function returns a JSON response containing either the retrieved group data or an error message with a 500 status code in case of failure.
 *
 * @param request - The incoming HTTP request.
 * @returns A JSON response with the groups data or an error message.
 */
export async function GET(request: Request) {
  try {
    const backendUrl = validateBackendUrl();
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const sortBy = searchParams.get('sort_by') || 'name';
    const sortDirection = searchParams.get('sort_direction') || 'asc';

    const response = await fetch(
      `${backendUrl}/api/groups?` + 
      new URLSearchParams({
        page,
        sort_by: sortBy,
        sort_direction: sortDirection,
      })
    ).catch(error => {
      console.error('Network error:', error);
      throw new Error('Failed to connect to backend service');
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in groups API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

/**
 * Creates a new group by forwarding a POST request to the backend service.
 *
 * This handler obtains the backend URL from the environment, extracts the JSON payload from the
 * incoming request, and sends it to the backend groups API endpoint. It returns a JSON response
 * with the backend's data on success. In case of a network failure or an unsuccessful backend
 * response, it logs the error and returns a JSON error message with a 500 status code.
 *
 * @returns A JSON response with the backend response data on success, or an error message on failure.
 */
export async function POST(request: Request) {
  try {
    const backendUrl = validateBackendUrl();
    const body = await request.json();
    
    const response = await fetch(`${backendUrl}/api/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }).catch(error => {
      console.error('Network error:', error);
      throw new Error('Failed to connect to backend service');
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in groups API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create group' },
      { status: 500 }
    );
  }
}
