import { NextResponse } from 'next/server';

function validateBackendUrl() {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error('BACKEND_URL environment variable is not set');
  }
  return backendUrl;
}

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
