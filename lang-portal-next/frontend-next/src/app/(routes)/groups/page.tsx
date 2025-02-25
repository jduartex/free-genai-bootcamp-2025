import Link from 'next/link'
import { getGroups } from '@/app/actions'
import { GroupsClient } from './groups-client'

/**
 * Fetches and displays group data.
 *
 * This asynchronous component retrieves groups and pagination details to render the Groups page.
 * It outputs a styled header, a link to create a new group, and the GroupsClient component to display the list of groups.
 *
 * @returns The JSX element representing the Groups page.
 */
export default async function Groups() {
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
}