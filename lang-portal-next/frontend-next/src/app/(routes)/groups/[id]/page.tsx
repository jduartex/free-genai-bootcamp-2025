'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  fetchGroupDetails, 
  fetchGroupStudySessions,
  fetchGroupWords,
  type GroupDetails,
  type StudySession,
  type StudySessionSortKey,
  type Word,
  type WordSortKey 
} from '@/services/api'
import WordsTable from '@/components/wordstable'
import StudySessionsTable from '@/components/studysessionstable'
import Pagination from '@/components/pagination'
import { useNavigation } from '@/context/NavigationContext'

/**
 * Renders a detailed view of a group.
 *
 * This component retrieves the group's details, associated words, and study sessions
 * using the group ID from the URL. It manages loading, error states, pagination, and sorting
 * for the words and study sessions, fetching data asynchronously on component mount and whenever
 * relevant parameters change. A cleanup effect resets the current group in the navigation context on unmount.
 *
 * @returns The JSX layout for displaying the group's information, including navigation, statistics,
 *          words table, and study sessions table with pagination controls.
 */
export default function GroupShow() {
  const params = useParams()
  const [group, setGroup] = useState<GroupDetails | null>(null)
  const { setCurrentGroup } = useNavigation()
  const [words, setWords] = useState<Word[]>([])
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [wordsPage, setWordsPage] = useState(1)
  const [wordsTotalPages, setWordsTotalPages] = useState(1)
  const [sessionsPage, setSessionsPage] = useState(1)
  const [sessionsTotalPages, setSessionsTotalPages] = useState(1)
  const [wordSortKey, setWordSortKey] = useState<WordSortKey>('created_at')
  const [wordSortDirection, setWordSortDirection] = useState<'asc' | 'desc'>('desc')
  const [sessionSortKey, setSessionSortKey] = useState<StudySessionSortKey>('created_at')
  const [sessionSortDirection, setSessionSortDirection] = useState<'asc' | 'desc'>('desc')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!params.id) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const groupData = await fetchGroupDetails(params.id as string)
        setGroup(groupData)
        setCurrentGroup(groupData)
        
        // Fetch words and study sessions in parallel
        const [wordsData, sessionsData] = await Promise.all([
          fetchGroupWords(
            params.id as string,
            wordsPage,
            wordSortKey,
            wordSortDirection
          ),
          fetchGroupStudySessions(
            params.id as string,
            sessionsPage,
            sessionSortKey,
            sessionSortDirection
          )
        ])
        
        setWords(wordsData.items)
        setWordsTotalPages(wordsData.total_pages)
        setStudySessions(sessionsData.items)
        setSessionsTotalPages(sessionsData.total_pages)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load group data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [params.id, wordsPage, sessionsPage, wordSortKey, wordSortDirection, sessionSortKey, sessionSortDirection, setCurrentGroup])

  // Clean up the context when unmounting
  useEffect(() => {
    return () => {
      setCurrentGroup(null)
    }
  }, [setCurrentGroup])

  const handleWordSort = (key: WordSortKey) => {
    if (key === wordSortKey) {
      setWordSortDirection(wordSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setWordSortKey(key)
      setWordSortDirection('desc')
    }
  }

  const handleSessionSort = (key: StudySessionSortKey) => {
    if (key === sessionSortKey) {
      setSessionSortDirection(sessionSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSessionSortKey(key)
      setSessionSortDirection('desc')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          Loading...
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6 text-red-500">
          {error || 'Group not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/groups"
          className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
        >
          ← Back to Groups
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">{group.name}</h1>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Group Statistics</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Words</p>
              <p className="mt-1 text-2xl font-semibold text-blue-500">{group.word_count}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Words in Group</h2>
          <WordsTable
            words={words}
            sortKey={wordSortKey}
            sortDirection={wordSortDirection}
            onSort={handleWordSort}
          />
          <Pagination
            currentPage={wordsPage}
            totalPages={wordsTotalPages}
            onPageChange={setWordsPage}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Study Sessions</h2>
          <StudySessionsTable
            sessions={studySessions}
            sortKey={sessionSortKey}
            sortDirection={sessionSortDirection}
            onSort={handleSessionSort}
          />
          <Pagination
            currentPage={sessionsPage}
            totalPages={sessionsTotalPages}
            onPageChange={setSessionsPage}
          />
        </div>
      </div>
    </div>
  )
}