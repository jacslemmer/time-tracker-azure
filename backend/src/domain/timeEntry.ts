import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { Result, validationError } from '../utils/Result';
import { hoursToSeconds } from './time';

// Domain types
export interface TimeEntry {
  readonly id: string;
  readonly project_id: string;
  readonly user_id: string;
  readonly seconds: number;
  readonly start_time: number;
  readonly end_time: number;
  readonly is_manual: boolean;
  readonly created_at: Date;
}

export interface CreateManualEntryData {
  readonly hours: number;
}

// Pure validation functions
export const validateHours = (hours: number): Result<any, number> =>
  hours >= 0.01
    ? E.right(hours)
    : E.left(validationError('Hours must be at least 0.01'));

export const validateManualEntry = (
  data: CreateManualEntryData
): Result<any, CreateManualEntryData> =>
  pipe(
    validateHours(data.hours),
    E.map(() => data)
  );

// Pure business logic
export const createManualEntry = (
  projectId: string,
  userId: string,
  hours: number,
  timestamp: number = Date.now()
): Omit<TimeEntry, 'created_at'> => ({
  id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
  project_id: projectId,
  user_id: userId,
  seconds: hoursToSeconds(hours),
  start_time: timestamp,
  end_time: timestamp,
  is_manual: true,
});

export const createTrackedEntry = (
  projectId: string,
  userId: string,
  startTime: number,
  endTime: number
): Omit<TimeEntry, 'created_at'> => ({
  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  project_id: projectId,
  user_id: userId,
  seconds: Math.floor((endTime - startTime) / 1000),
  start_time: startTime,
  end_time: endTime,
  is_manual: false,
});

export const calculateEntryDifference = (
  oldSeconds: number,
  newHours: number
): number => hoursToSeconds(newHours) - oldSeconds;

export const updateProjectTotalSeconds = (
  currentTotal: number,
  difference: number
): number => Math.max(0, currentTotal + difference);
