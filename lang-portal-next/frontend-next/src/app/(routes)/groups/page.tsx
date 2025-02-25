import Link from 'next/link'
import { getGroups } from '@/app/actions'
import { GroupsClient } from './groups-client'

export default async function Groups() {
  try {
    const response = await getGroups()

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Word Groups</h1>
          <Link
            href="/groups/new"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Create Group
          </Link>
        </div>

        <GroupsClient initialGroups={response.groups} totalPages={response.total_pages} />
      </div>
    )
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Word Groups</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          Failed to load groups. Please try again later.
        </div>
      </div>
    );
  }
}