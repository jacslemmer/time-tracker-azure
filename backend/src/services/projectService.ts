import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { DbConnection } from '../utils/database';
import { AsyncResult, validationError, conflictError } from '../utils/Result';
import * as ProjectRepo from '../repositories/projectRepository';
import * as TimeEntryRepo from '../repositories/timeEntryRepository';
import {
  Project,
  CreateProjectData,
  UpdateProjectData,
  validateCreateProject,
  canEditProject,
  generateProjectId,
} from '../domain/project';
import { calculateElapsed } from '../domain/time';

// Dependencies type
export interface ProjectServiceDeps {
  readonly pool: DbConnection;
}

// Get all projects for user
export const getAllProjects =
  ({ pool }: ProjectServiceDeps) =>
  (userId: string): AsyncResult<any, ReadonlyArray<Project>> =>
    ProjectRepo.findAllByUserId(pool)(userId);

// Create new project
export const createProject =
  ({ pool }: ProjectServiceDeps) =>
  (userId: string, data: CreateProjectData): AsyncResult<any, Project> =>
    pipe(
      TE.fromEither(validateCreateProject(data)),
      TE.chain(() => {
        const projectId = generateProjectId();
        return ProjectRepo.create(pool)(projectId, userId, data);
      })
    );

// Update project
export const updateProject =
  ({ pool }: ProjectServiceDeps) =>
  (
    id: string,
    userId: string,
    data: UpdateProjectData
  ): AsyncResult<any, Project> =>
    pipe(
      ProjectRepo.findById(pool)(id, userId),
      TE.chain((project) =>
        canEditProject(project)
          ? TE.right(project)
          : TE.left(validationError('Cannot edit while timer is running'))
      ),
      TE.chain(() => {
        const updates: Record<string, any> = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.clientName !== undefined) updates.client_name = data.clientName;
        if (data.hourlyRate !== undefined) updates.hourly_rate = data.hourlyRate;
        if (data.budget !== undefined) updates.budget = data.budget;

        return Object.keys(updates).length > 0
          ? ProjectRepo.update(pool)(id, userId, updates)
          : TE.left(validationError('No fields to update'));
      })
    );

// Delete project (cascading)
export const deleteProject =
  ({ pool }: ProjectServiceDeps) =>
  (id: string, userId: string): AsyncResult<any, boolean> =>
    pipe(
      TimeEntryRepo.deleteAllByProjectId(pool)(id, userId),
      TE.chain(() => ProjectRepo.deleteById(pool)(id, userId))
    );

// Start timer
export const startProjectTimer =
  ({ pool }: ProjectServiceDeps) =>
  (id: string, userId: string): AsyncResult<any, Project> =>
    pipe(
      // Check if project exists and is not running
      ProjectRepo.findById(pool)(id, userId),
      TE.chain((project) =>
        project.is_running
          ? TE.left(validationError('Timer already running'))
          : TE.right(project)
      ),
      // Check if any other timer is running
      TE.chain(() => ProjectRepo.findRunningProjects(pool)(userId)),
      TE.chain((runningProjects) =>
        runningProjects.length > 0
          ? TE.left(conflictError('Another timer is already running'))
          : TE.right(Date.now())
      ),
      // Start timer
      TE.chain((startTime) => ProjectRepo.startTimer(pool)(id, userId, startTime))
    );

// Stop timer
export const stopProjectTimer =
  ({ pool }: ProjectServiceDeps) =>
  (
    id: string,
    userId: string
  ): AsyncResult<any, { project: Project; elapsed: number }> =>
    pipe(
      ProjectRepo.findById(pool)(id, userId),
      TE.chain((project) => {
        // Convert start_time to number if it's a string (from PostgreSQL)
        const startTime = typeof project.start_time === 'string'
          ? parseInt(project.start_time, 10)
          : project.start_time;

        // Check if timer is actually running
        if (!project.is_running || !startTime) {
          console.error('Timer stop validation failed:', {
            is_running: project.is_running,
            start_time: project.start_time,
            start_time_type: typeof project.start_time
          });
          return TE.left(validationError('Timer is not running'));
        }

        return TE.right({ ...project, start_time: startTime });
      }),
      TE.chain((project) => {
        const elapsed = calculateElapsed(project.start_time!, Date.now());
        return pipe(
          ProjectRepo.stopTimer(pool)(id, userId, elapsed),
          TE.map((updatedProject) => ({
            project: updatedProject,
            elapsed,
          }))
        );
      })
    );

// Get current timer seconds
export const getCurrentTimerSeconds =
  ({ pool }: ProjectServiceDeps) =>
  (id: string, userId: string): AsyncResult<any, { seconds: number; isRunning: boolean }> =>
    pipe(
      ProjectRepo.findById(pool)(id, userId),
      TE.map((project) => ({
        seconds: project.is_running && project.start_time
          ? project.total_seconds + calculateElapsed(project.start_time, Date.now())
          : project.total_seconds,
        isRunning: project.is_running,
      }))
    );
