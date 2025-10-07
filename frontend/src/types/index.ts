export interface Project {
  id: string;
  user_id: string;
  client_name: string;
  name: string;
  hourly_rate: number;
  budget: number;
  total_seconds: number;
  is_running: boolean;
  start_time?: number;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  project_id: string;
  user_id: string;
  seconds: number;
  start_time: number;
  end_time: number;
  is_manual: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Warning {
  type: 'long-session';
  message: string;
  projectId: string;
  projectName: string;
  hours: string;
}

export type DateFilter = 'all' | 'today' | 'this-week' | 'this-month' | 'this-year' | 'custom';
export type ReportType = 'all' | 'by-client' | 'by-project';
