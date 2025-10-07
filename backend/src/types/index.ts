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
  created_at: Date;
  updated_at: Date;
}

export interface TimeEntry {
  id: string;
  project_id: string;
  user_id: string;
  seconds: number;
  start_time: number;
  end_time: number;
  is_manual: boolean;
  created_at: Date;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest extends Express.Request {
  user?: {
    id: string;
    email: string;
  };
}

export interface Warning {
  type: 'long-session';
  message: string;
  projectId: string;
  projectName: string;
  hours: string;
}
