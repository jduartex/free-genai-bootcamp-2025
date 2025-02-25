'use server'

import { headers } from 'next/headers'
import { type StudyStats, type RecentSession, type Group, type StudyActivity, type GroupDetails, type Word, type StudySession, type WordSortKey, type StudySessionSortKey, type PaginatedResponse } from '@/services/api'

async function fetchFromApi(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any) {
  try {
    const headersList = await headers()
    const host = await headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    
    const response = await fetch(`${protocol}://${host}/api${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status} for endpoint: ${endpoint}`)
      throw new Error(`HTTP error! status: ${response.status} for endpoint: ${endpoint}`)
    }

    return response.json()
  } catch (error: any) {
    console.error(`Failed to fetch from API endpoint: ${endpoint}`, error)
    throw new Error(`Failed to fetch from API: ${error.message}`)
  }
}

export async function getStudyStats(): Promise<StudyStats> {
  return fetchFromApi('/study/stats')
}

export async function getRecentStudySession(type: 'recent' | 'all' = 'all'): Promise<RecentSession> {
  return fetchFromApi(`/study/recent-sessions${type === 'recent' ? '?type=recent' : ''}`)
}

export async function getGroups(
  page: number = 1,
  sortBy: string = 'name',
  sortDirection: 'asc' | 'desc' = 'asc'
): Promise<{ groups: Group[], total_pages: number }> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    sort_by: sortBy,
    sort_direction: sortDirection,
  })
  return fetchFromApi(`/groups?${searchParams.toString()}`)
}

export async function getStudyActivity(id: string): Promise<StudyActivity> {
  return fetchFromApi(`/study-activities/${id}`)
}

export async function getStudyActivities(): Promise<StudyActivity[]> {
  return fetchFromApi('/study-activities')
}

export async function getGroupDetails(id: string): Promise<GroupDetails> {
  return fetchFromApi(`/groups/${id}`)
}

export async function getGroupWords(
  groupId: string,
  page: number,
  sortKey: WordSortKey,
  sortDirection: 'asc' | 'desc'
): Promise<PaginatedResponse<Word>> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    sort_key: sortKey,
    sort_direction: sortDirection,
  })
  return fetchFromApi(`/groups/${groupId}/words?${searchParams.toString()}`)
}

export async function getGroupStudySessions(
  groupId: string,
  page: number,
  sortKey: StudySessionSortKey,
  sortDirection: 'asc' | 'desc'
): Promise<PaginatedResponse<StudySession>> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    sort_key: sortKey,
    sort_direction: sortDirection,
  })
  return fetchFromApi(`/groups/${groupId}/study-sessions?${searchParams.toString()}`)
}
