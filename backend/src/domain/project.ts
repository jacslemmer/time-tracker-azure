import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { Result, validationError } from '../utils/Result';

// Domain types
export interface Project {
  readonly id: string;
  readonly user_id: string;
  readonly client_name: string;
  readonly name: string;
  readonly hourly_rate: number;
  readonly budget: number;
  readonly total_seconds: number;
  readonly is_running: boolean;
  readonly start_time?: number;
  readonly created_at: Date;
  readonly updated_at: Date;
}

export interface CreateProjectData {
  readonly name: string;
  readonly clientName: string;
  readonly hourlyRate: number;
  readonly budget: number;
}

export interface UpdateProjectData {
  readonly name?: string;
  readonly clientName?: string;
  readonly hourlyRate?: number;
  readonly budget?: number;
}

// Pure validation functions
export const validateProjectName = (name: string): Result<any, string> =>
  name.trim().length > 0
    ? E.right(name.trim())
    : E.left(validationError('Project name is required'));

export const validateHourlyRate = (rate: number): Result<any, number> =>
  rate > 0
    ? E.right(rate)
    : E.left(validationError('Hourly rate must be positive'));

export const validateBudget = (budget: number): Result<any, number> =>
  budget > 0
    ? E.right(budget)
    : E.left(validationError('Budget must be positive'));

export const validateCreateProject = (
  data: CreateProjectData
): Result<any, CreateProjectData> =>
  pipe(
    E.Do,
    E.apS('name', validateProjectName(data.name)),
    E.apS('hourlyRate', validateHourlyRate(data.hourlyRate)),
    E.apS('budget', validateBudget(data.budget)),
    E.map(() => data)
  );

// Pure business logic
export const calculateBilling = (project: Project): number =>
  (project.total_seconds / 3600) * project.hourly_rate;

export const calculateBudgetPercentage = (project: Project): number => {
  const billing = calculateBilling(project);
  return (billing / project.budget) * 100;
};

export const getBudgetStatus = (
  project: Project
): 'normal' | 'warning' | 'danger' => {
  const percentage = calculateBudgetPercentage(project);
  if (percentage >= 100) return 'danger';
  if (percentage >= 80) return 'warning';
  return 'normal';
};

export const canEditProject = (project: Project): boolean =>
  !project.is_running;

export const generateProjectId = (): string =>
  Date.now().toString();
