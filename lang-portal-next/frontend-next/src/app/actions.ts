'use server'

import { headers } from 'next/headers'
import { type StudyStats, type RecentSession, type Group, type StudyActivity, type GroupDetails, type Word, type StudySession, type WordSortKey, type StudySessionSortKey, type PaginatedResponse } from '@/services/api'

/**
 * Sends an HTTP request to the API and returns the parsed JSON response.
 *
 * This function constructs the full API URL by determining the protocol based on the runtime
 * environment and extracting the host from the request headers. It supports both 'GET' and 'POST'
 * methods and serializes the provided data as JSON when applicable.
 *
 * @param endpoint - The API endpoint to target (e.g., '/study/stats').
 * @param method - The HTTP method to use, either 'GET' or 'POST'. Defaults to 'GET'.
 * @param data - Optional data to include in the request body, which will be serialized to JSON.
 * @returns A promise that resolves with the parsed JSON response from the API.
 *
 * @throws {Error} When the response status is not successful or a network error occurs.
 */
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

/**
 * Retrieves study statistics from the API.
 *
 * Sends a GET request to the "/study/stats" endpoint and returns a promise that resolves to the study statistics.
 *
 * @returns A promise that resolves to the study statistics.
 */
export async function getStudyStats(): Promise<StudyStats> {
  return fetchFromApi('/study/stats')
}

/**
 * Retrieves recent study session data.
 *
 * If the type is 'recent', it fetches only the most recent session by appending a query parameter to the API endpoint.
 * When the type is 'all', it retrieves all available recent study sessions.
 *
 * @param type - Determines whether to fetch only the most recent session ('recent') or all sessions ('all'). Defaults to 'all'.
 * @returns A promise that resolves to a RecentSession object.
 */
export async function getRecentStudySession(type: 'recent' | 'all' = 'all'): Promise<RecentSession> {
  return fetchFromApi(`/study/recent-sessions${type === 'recent' ? '?type=recent' : ''}`)
}

/**
 * Retrieves a paginated list of groups with specified sorting options.
 *
 * Constructs a query string from the provided pagination and sorting parameters,
 * and sends a request to the `/groups` endpoint. Returns a promise that resolves
 * to an object containing an array of groups and the total number of pages.
 *
 * @param page - The page number to retrieve (default is 1).
 * @param sortBy - The field by which to sort the groups (default is 'name').
 * @param sortDirection - The sort order, either 'asc' for ascending or 'desc' for descending (default is 'asc').
 * @returns A promise that resolves to an object with the list of groups and the total number of pages.
 */
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

/**
 * Retrieves a specific study activity by its ID.
 *
 * @param id - The unique identifier of the study activity.
 * @returns A promise that resolves to the corresponding StudyActivity object.
 */
export async function getStudyActivity(id: string): Promise<StudyActivity> {
  return fetchFromApi(`/study-activities/${id}`)
}

/**
 * Retrieves all study activities.
 *
 * Calls the API endpoint `/study-activities` to fetch a complete list of study activity objects.
 *
 * @returns A promise that resolves to an array of StudyActivity objects.
 */
export async function getStudyActivities(): Promise<StudyActivity[]> {
  return fetchFromApi('/study-activities')
}

/**
 * Retrieves details for a specific group.
 *
 * Constructs the API endpoint using the provided group ID and returns a promise
 * that resolves to the group's details.
 *
 * @param id - The unique identifier of the group.
 * @returns A promise that resolves to the group's details.
 */
export async function getGroupDetails(id: string): Promise<GroupDetails> {
  return fetchFromApi(`/groups/${id}`)
}

/**
 * Retrieves a paginated list of words for the specified group with sorting options.
 *
 * Constructs a query string with pagination and sorting parameters and sends a GET request to the API,
 * returning the paginated response of words.
 *
 * @param groupId - The unique identifier of the group.
 * @param page - The page number to retrieve.
 * @param sortKey - The field by which the words should be sorted.
 * @param sortDirection - The sort order: 'asc' for ascending or 'desc' for descending.
 * @returns A promise that resolves to a paginated response containing words and pagination details.
 */
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

/**
 * Retrieves paginated study sessions for a specified group.
 *
 * Constructs a query string with pagination and sorting parameters, then fetches study session data from the API.
 *
 * @param groupId - The identifier of the group.
 * @param page - The page number for pagination.
 * @param sortKey - The key by which to sort the study sessions.
 * @param sortDirection - The sort order, either "asc" for ascending or "desc" for descending.
 * @returns A promise resolving to a paginated response containing the group's study sessions.
 */
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
