'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { type Group } from '@/services/api'
import { getGroups } from '@/app/actions'

type SortKey = 'name' | 'word_count'

interface GroupsClientProps {
  initialGroups: Group[]
  totalPages: number
}

export function GroupsClient({ initialGroups, totalPages }: GroupsClientProps) {
  const [groups, setGroups] = useState(initialGroups)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const handleSort = async (key: SortKey) => {
    const newDirection = key === sortKey && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortKey(key)
    setSortDirection(newDirection)
    setIsLoading(true)

    try {
      const response = await getGroups(currentPage, key, newDirection)
      setGroups(response.groups)
    } catch (error) {
      console.error('Failed to sort groups:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = async (page: number) => {
    setCurrentPage(page)
    setIsLoading(true)

    try {
      const response = await getGroups(page, sortKey, sortDirection)
      setGroups(response.groups)
    } catch (error) {
      console.error('Failed to change page:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 border-b">
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Name
                {sortKey === 'name' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('word_count')}
              >
                Word Count
                {sortKey === 'word_count' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : groups.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No groups found
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <tr key={group.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      href={`/groups/${group.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                    >
                      {group.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                    {group.word_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      href={`/groups/${group.id}/edit`}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4"
                    >
                      Edit
                    </Link>
                    <Link 
                      href={`/groups/${group.id}/study`}
                      className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                    >
                      Study
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded ${
                currentPage === page
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
