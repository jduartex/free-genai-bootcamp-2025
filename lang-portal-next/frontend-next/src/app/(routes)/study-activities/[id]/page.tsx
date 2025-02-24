'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useNavigation } from '@/context/NavigationContext'
import StudySessionsTable from '@/components/studysessionstable'
import Pagination from '@/components/pagination'
import { fetchStudyActivity, type StudyActivity } from '@/services/api'

type Session = {
  id: number
  group_name: string
  group_id: number
  activity_id: number
  activity_name: string
  start_time: string
  end_time: string
  review_items_count: number
}

type PaginatedSessions = {
  items: Session[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

const ITEMS_PER_PAGE = 10

export default function StudyActivityShow() {
  const params = useParams()
  const { setCurrentStudyActivity } = useNavigation()
  const [activity, setActivity] = useState<StudyActivity | null>(null)
  const [sessionData, setSessionData] = useState<PaginatedSessions | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return
      
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/study-activities/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch study activity')
        }
        const data = await response.json()
        setActivity(data)
        setCurrentStudyActivity(data)
        
        // Fetch sessions for the current page
        const sessionsResponse = await fetch(
          `http://127.0.0.1:5000/api/study-activities/${params.id}/sessions?page=${currentPage}&per_page=${ITEMS_PER_PAGE}`
        )
        if (!sessionsResponse.ok) {
          throw new Error('Failed to fetch sessions')
        }
        const sessionsData = await sessionsResponse.json()
        setSessionData({
          items: sessionsData.items.map((item: any) => ({
            id: item.id,
            group_name: item.group_name,
            group_id: item.group_id,
            activity_id: item.activity_id,
            activity_name: item.activity_name,
            start_time: item.start_time,
            end_time: item.end_time,
            review_items_count: item.review_items_count
          })),
          total: sessionsData.total,
          page: sessionsData.page,
          per_page: sessionsData.per_page,
          total_pages: sessionsData.total_pages
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, currentPage, setCurrentStudyActivity])

  // Clean up when unmounting
  useEffect(() => {
    return () => {
      setCurrentStudyActivity(null)
    }
  }, [setCurrentStudyActivity])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          Loading activity details...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6 text-red-500">
          Error: {error}
        </div>
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          Activity not found
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/study-activities"
          className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
        >
          ← Back to Study Activities
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">{activity.title}</h1>
        <p className="text-gray-600 mb-6">{activity.description}</p>

        <div className="grid gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Activity Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="mt-1 font-medium">{activity.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Difficulty</p>
                <p className="mt-1 font-medium">{activity.difficulty}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Instructions</h2>
            <div className="prose max-w-none">
              <p>{activity.instructions}</p>
            </div>
          </div>

          <div>
            <Link
              href={`/study-activities/${activity.id}/launch`}
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Launch
            </Link>
          </div>
        </div>
      </div>

      {sessionData && sessionData.items.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Study Sessions</h2>
          <StudySessionsTable sessions={sessionData.items} />
          {sessionData.total_pages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={sessionData.total_pages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}