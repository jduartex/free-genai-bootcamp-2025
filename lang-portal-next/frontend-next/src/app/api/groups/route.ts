import { NextResponse } from 'next/server';

// Mock data for development
const mockGroups = [
  {
    id: '1',
    name: 'Common Verbs',
    word_count: 25,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Food Vocabulary',
    word_count: 30,
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
  {
    id: '3',
    name: 'Travel Phrases',
    word_count: 20,
    created_at: '2025-01-03T00:00:00Z',
    updated_at: '2025-01-03T00:00:00Z',
  },
];

export async function GET(request: Request) {
  // Get URL parameters
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const sortBy = searchParams.get('sort_by') || 'name';
  const sortDirection = searchParams.get('sort_direction') || 'asc';
  
  // Sort groups
  const sortedGroups = [...mockGroups].sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a];
    const bValue = b[sortBy as keyof typeof b];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  // Pagination
  const itemsPerPage = 10;
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedGroups = sortedGroups.slice(start, end);
  const totalPages = Math.ceil(sortedGroups.length / itemsPerPage);

  return NextResponse.json({
    groups: paginatedGroups,
    total_pages: totalPages,
  });
}
