import { NextResponse } from 'next/server';

/**
 * Retrieves a group by its ID.
 *
 * This asynchronous function sends a GET request to the backend API to fetch details for the group identified by the provided ID.
 * If the response is not successful, the error is logged and a JSON response with a 500 status code and an error message is returned.
 *
 * @example
 * GET(request, { params: { id: "group123" } });
 *
 * @param params - An object containing the group identifier.
 *
 * @returns A JSON response with the group data if the request is successful; otherwise, a JSON error response.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/api/groups/${params.id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

/**
 * Updates a group identified by its unique ID.
 *
 * This function parses the JSON payload from the incoming request and sends it in a PUT request to the backend API to update the group.
 * If the backend response is not successful, it logs the error and returns a JSON response with a 500 status code.
 *
 * @param request - The HTTP request containing the update data.
 * @param params - An object containing:
 *   - id: The unique identifier of the group to update.
 *
 * @returns A JSON response with the updated group data or an error message if the update fails.
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const response = await fetch(`${process.env.BACKEND_URL}/api/groups/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

/**
 * Deletes a group identified by its ID.
 *
 * Sends a DELETE request to the backend service to remove the specific group. If the deletion is successful, it returns a 204 No Content response.
 * On failure, it logs the error and returns a JSON response with a 500 status and an error message.
 *
 * @param request - The incoming HTTP request.
 * @param params - Contains the group identifier under the key "id".
 *
 * @returns A NextResponse with a 204 status on success or a JSON response with a 500 status on failure.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/api/groups/${params.id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}
