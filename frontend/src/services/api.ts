import { Project, TimeEntry, AuthResponse, Warning } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Pure functions for token management
export const getToken = (): string | null => localStorage.getItem('token');

export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const clearToken = (): void => {
  localStorage.removeItem('token');
};

// Pure function to create headers
const createHeaders = (token: string | null): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// Type for API call results
export type ApiResult<T> = Promise<T>;

// Generic fetch wrapper
const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): ApiResult<T> => {
  const token = getToken();
  const headers = createHeaders(token);

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// Auth API functions
export const register = async (email: string, password: string): ApiResult<AuthResponse> => {
  const data = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
};

export const login = async (email: string, password: string): ApiResult<AuthResponse> => {
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
};

// Project API functions
export const getProjects = (): ApiResult<Project[]> =>
  apiFetch<Project[]>('/projects');

export const createProject = (data: {
  name: string;
  clientName: string;
  hourlyRate: number;
  budget: number;
}): ApiResult<Project> =>
  apiFetch<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateProject = (
  id: string,
  data: Partial<{
    name: string;
    clientName: string;
    hourlyRate: number;
    budget: number;
  }>
): ApiResult<Project> =>
  apiFetch<Project>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteProject = (id: string): ApiResult<void> =>
  apiFetch<void>(`/projects/${id}`, { method: 'DELETE' });

// Timer API functions
export const startTimer = (projectId: string): ApiResult<Project> =>
  apiFetch<Project>(`/projects/${projectId}/timer/start`, { method: 'POST' });

export const stopTimer = (projectId: string): ApiResult<{ project: Project; entry: TimeEntry }> =>
  apiFetch<{ project: Project; entry: TimeEntry }>(`/projects/${projectId}/timer/stop`, {
    method: 'POST',
  });

export const getCurrentTimer = (
  projectId: string
): ApiResult<{ seconds: number; isRunning: boolean }> =>
  apiFetch<{ seconds: number; isRunning: boolean }>(`/projects/${projectId}/timer/current`);

// Time Entry API functions
export const getTimeEntries = (projectId?: string): ApiResult<TimeEntry[]> => {
  const url = projectId ? `/time-entries?projectId=${projectId}` : '/time-entries';
  return apiFetch<TimeEntry[]>(url);
};

export const addManualEntry = (
  projectId: string,
  hours: number
): ApiResult<{ project: Project; entry: TimeEntry }> =>
  apiFetch<{ project: Project; entry: TimeEntry }>(`/time-entries/${projectId}/manual`, {
    method: 'POST',
    body: JSON.stringify({ hours }),
  });

export const updateTimeEntry = (
  id: string,
  hours: number
): ApiResult<{ success: boolean; project: Project }> =>
  apiFetch<{ success: boolean; project: Project }>(`/time-entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ hours }),
  });

export const deleteTimeEntry = (
  id: string
): ApiResult<{ success: boolean; project: Project }> =>
  apiFetch<{ success: boolean; project: Project }>(`/time-entries/${id}`, { method: 'DELETE' });

// Report API functions
export const getReport = (
  type: string,
  dateFilter: string,
  startDate?: string,
  endDate?: string
): ApiResult<any[]> => {
  const params = new URLSearchParams({ type, dateFilter });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  return apiFetch<any[]>(`/reports?${params}`);
};

export const exportCSV = async (data: any[]): Promise<Blob> => {
  const token = getToken();
  const headers = createHeaders(token);

  const response = await fetch(`${API_URL}/reports/export/csv`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });

  if (!response.ok) throw new Error('Failed to export CSV');
  return response.blob();
};

export const exportJSON = async (data: any[]): Promise<Blob> => {
  const token = getToken();
  const headers = createHeaders(token);

  const response = await fetch(`${API_URL}/reports/export/json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });

  if (!response.ok) throw new Error('Failed to export JSON');
  return response.blob();
};

// Warning API functions
export const getWarnings = (): ApiResult<Warning[]> =>
  apiFetch<Warning[]>('/warnings');
