import axios, { AxiosError, AxiosInstance } from 'axios';

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const REQUEST_TIMEOUT = 5000;

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

// Create API instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a flag to track API availability
let isApiAvailable = true;

// Sleep utility
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface APIErrorResponse {
  message: string;
}

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Fallback data providers
const fallbackData = {
  theme: { theme: 'system' },
  studyStats: {
    totalSessions: 0,
    totalWords: 0,
    averageAccuracy: 0,
    studyStreak: 0,
  },
  groups: {
    groups: [],
    total_pages: 0,
  },
  // Add other fallbacks as needed
};

export const fetchData = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  data?: unknown,
  retries: number = MAX_RETRIES
): Promise<T> => {
  // If API was unavailable and we're not retrying, use fallback in dev mode
  if (!isApiAvailable && retries === MAX_RETRIES && isDev) {
    console.warn(`API unavailable, using fallback data for ${endpoint}`);
    
    // Return appropriate fallback data based on endpoint
    if (endpoint === '/settings/theme') return fallbackData.theme as T;
    if (endpoint === '/study/stats') return fallbackData.studyStats as T;
    if (endpoint === '/groups') return fallbackData.groups as T;
    
    // Default fallback is an empty object
    return {} as T;
  }

  try {
    const response = await api.request({
      method,
      url: endpoint,
      data,
    });
    
    // If we get here, API is available
    if (!isApiAvailable) {
      console.log('API connection restored');
      isApiAvailable = true;
    }
    
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      // Check if this is a connection error
      const isConnectionError = error.code === 'ECONNREFUSED' || 
                               error.code === 'ECONNABORTED' || 
                               error.message.includes('Network Error');
      
      // Log detailed error information
      console.error(`API Error (${error.response?.status || 'Connection Error'}):`, {
        endpoint,
        errorCode: error.code,
        errorMessage: error.message,
        response: error.response?.data,
      });

      // Mark API as unavailable on connection errors
      if (isConnectionError) {
        isApiAvailable = false;
        console.error('API server appears to be unavailable at:', api.defaults.baseURL);
        
        // When in development, provide helpful troubleshooting tips
        if (isDev) {
          console.info('Troubleshooting tips:');
          console.info('1. Check if the API server is running on port 3001');
          console.info('2. Verify NEXT_PUBLIC_API_URL is set correctly in .env.local');
          console.info('3. Check for firewall or network issues');
          console.info('4. Using fallback data for development');
          
          // Return fallback data in development mode
          if (endpoint === '/settings/theme') return fallbackData.theme as T;
          if (endpoint === '/study/stats') return fallbackData.studyStats as T;
          if (endpoint === '/groups') return fallbackData.groups as T;
          
          return {} as T;
        }
      }

      // Retry on network errors or 5xx server errors
      if (retries > 0 && (isConnectionError || !error.response || error.response.status >= 500)) {
        console.warn(`Retrying request to ${endpoint}. Attempts remaining: ${retries - 1}`);
        await sleep(RETRY_DELAY);
        return fetchData(endpoint, method, data, retries - 1);
      }

      throw new APIError(
        (error.response?.data as APIErrorResponse)?.message || error.message,
        error.response?.status,
        error.code
      );
    }
    throw new APIError('An unexpected error occurred');
  }
};

export interface StudyStats {
  totalSessions: number;
  totalWords: number;
  averageAccuracy: number;
  studyStreak: number;
}

export interface RecentSession {
  id: string;
  created_at: string;
  activity_name: string;
  group_id: string;
  correct_count: number;
  wrong_count: number;
  duration: number;
  wordsStudied: number;
  accuracy: number;
}

export const fetchStudyStats = async () => {
  return fetchData<StudyStats>('/study/stats');
};

export const fetchRecentStudySession = async (type: 'recent' | 'all' = 'all') => {
  return fetchData(`/study/recent-sessions${type === 'recent' ? '?type=recent' : ''}`);
};

export interface Group {
  id: string;
  name: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface GroupsResponse {
  groups: Group[];
  total_pages: number;
}

export const fetchGroups = async (
  page: number = 1,
  sortBy: string = 'name',
  sortDirection: 'asc' | 'desc' = 'asc'
): Promise<GroupsResponse> => {
  return fetchData<GroupsResponse>(`/groups`, 'GET', undefined, MAX_RETRIES);
};

export interface StudyActivity {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  description: string;
  instructions: string;
}

export const fetchStudyActivity = async (id: string): Promise<StudyActivity> => {
  return fetchData(`/study-activities/${id}`);
};

export const fetchStudyActivities = async (): Promise<StudyActivity[]> => {
  return fetchData('/study-activities');
};

export interface GroupDetails {
  id: string;
  name: string;
  word_count: number;
}

export interface Word {
  id: string;
  kanji: string;
  reading: string;
  meaning: string;
  created_at: string;
}

export interface StudySession {
  id: string;
  start_time: string;
  end_time: string;
  score: number;
  created_at: string;
}

export type WordSortKey = 'kanji' | 'reading' | 'meaning' | 'created_at';
export type StudySessionSortKey = 'start_time' | 'end_time' | 'score' | 'created_at';

interface PaginatedResponse<T> {
  items: T[];
  total_pages: number;
}

export const fetchGroupDetails = async (id: string): Promise<GroupDetails> => {
  return fetchData(`/groups/${id}`);
};

export const fetchGroupWords = async (
  groupId: string,
  page: number,
  sortKey: WordSortKey,
  sortDirection: 'asc' | 'desc'
): Promise<PaginatedResponse<Word>> => {
  return fetchData(`/groups/${groupId}/words?page=${page}&sort_key=${sortKey}&sort_direction=${sortDirection}`);
};

export const fetchGroupStudySessions = async (
  groupId: string,
  page: number,
  sortKey: StudySessionSortKey,
  sortDirection: 'asc' | 'desc'
): Promise<PaginatedResponse<StudySession>> => {
  return fetchData(`/groups/${groupId}/study-sessions?page=${page}&sort_key=${sortKey}&sort_direction=${sortDirection}`);
};

export const fetchTheme = async () => {
  return fetchData<{ theme: string }>('/settings/theme');
};

export const updateTheme = async (theme: string) => {
  return fetchData<{ theme: string }>('/settings/theme', 'POST', { theme });
}

// Dashboard Interfaces
export interface DashboardStats {
  total_words_studied: number;
  study_sessions_completed: number;
  average_accuracy: number;
}

export interface StudyProgress {
  daily_progress: {
    date: string;
    words_studied: number;
    accuracy: number;
  }[];
}

// New API Methods
export const fetchLastStudySession = async () => {
  return fetchData('/dashboard/last_study_session');
};

export const fetchStudyProgress = async () => {
  return fetchData<StudyProgress>('/dashboard/study_progress');
};

export const fetchQuickStats = async () => {
  return fetchData<DashboardStats>('/dashboard/quick-stats');
};

export const fetchActivityStudySessions = async (activityId: string) => {
  return fetchData<PaginatedResponse<StudySession>>(`/study-activities/${activityId}/study-sessions`);
};

export const createStudyActivity = async (data: Partial<StudyActivity>) => {
  return fetchData('/study_activities', 'POST', data);
};

export const fetchAllWords = async (page: number = 1) => {
  return fetchData(`/words?page=${page}`);
};

export const fetchWordById = async (id: string) => {
  return fetchData(`/words/${id}`);
};

export const createWord = async (wordData: Partial<Word>) => {
  return fetchData('/words', 'POST', wordData);
};

export const fetchStudySessionById = async (id: string) => {
  return fetchData(`/study_sessions/${id}`);
};

export const fetchStudySessionWords = async (sessionId: string) => {
  return fetchData(`/study_sessions/${sessionId}/words`);
};

export interface WordReview {
  correct: boolean;
  time_taken: number;
  notes?: string;
}

export const submitWordReview = async (sessionId: string, wordId: string, reviewData: WordReview) => {
  return fetchData<{ success: boolean }>(`/study-sessions/${sessionId}/words/${wordId}/review`, 'POST', reviewData);
};

export interface CreateStudySession {
  activity_id: string;
  group_id: string;
  start_time: string;
}

export const createStudySession = async (sessionData: CreateStudySession) => {
  return fetchData<StudySession>('/study-sessions', 'POST', sessionData);
};

export const createGroup = async (groupData: Pick<Group, 'name'>) => {
  return fetchData<Group>('/groups', 'POST', groupData);
};

export const resetStudyHistory = async () => {
  return fetchData<{ success: boolean }>('/reset-history', 'POST');
};

export const performFullReset = async () => {
  return fetchData<{ success: boolean }>('/full-reset', 'POST');
};
