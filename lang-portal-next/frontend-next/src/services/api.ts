import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api',
});

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

export const fetchData = async (endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any) => {
  try {
    const response = await api.request({
      method,
      url: endpoint,
      data,
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
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
  return fetchData('/study/stats') as Promise<StudyStats>;
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
  const response = await api.get('/groups', {
    params: {
      page,
      sort_by: sortBy,
      sort_direction: sortDirection,
    },
  });
  return response.data;
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
  return fetchData('/settings/theme') as Promise<{ theme: string }>;
};

export const updateTheme = async (theme: string) => {
  return fetchData('/settings/theme', 'POST', { theme }) as Promise<{ theme: string }>;
};
