import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { DbConnection } from '../utils/database';
import { AsyncResult } from '../utils/Result';
import * as TimeEntryRepo from '../repositories/timeEntryRepository';
import * as ProjectRepo from '../repositories/projectRepository';
import {
  TimeEntry,
  createManualEntry,
  validateManualEntry,
  calculateEntryDifference,
  updateProjectTotalSeconds,
} from '../domain/timeEntry';
import { Project } from '../domain/project';
import { hoursToSeconds } from '../domain/time';

export interface TimeEntryServiceDeps {
  readonly pool: DbConnection;
}

// Get all time entries for user
export const getAllTimeEntries =
  ({ pool }: TimeEntryServiceDeps) =>
  (userId: string): AsyncResult<any, ReadonlyArray<TimeEntry>> =>
    TimeEntryRepo.findAllByUserId(pool)(userId);

// Get time entries for project
export const getProjectTimeEntries =
  ({ pool }: TimeEntryServiceDeps) =>
  (projectId: string, userId: string): AsyncResult<any, ReadonlyArray<TimeEntry>> =>
    TimeEntryRepo.findAllByProjectId(pool)(projectId, userId);

// Add manual time entry
export const addManualTimeEntry =
  ({ pool }: TimeEntryServiceDeps) =>
  (
    projectId: string,
    userId: string,
    hours: number
  ): AsyncResult<any, { project: Project; entry: TimeEntry }> =>
    pipe(
      TE.fromEither(validateManualEntry({ hours })),
      TE.chain(() => ProjectRepo.findById(pool)(projectId, userId)),
      TE.chain((project) => {
        const entry = createManualEntry(projectId, userId, hours);
        const newTotalSeconds = project.total_seconds + entry.seconds;

        return pipe(
          TimeEntryRepo.create(pool)(entry),
          TE.chain((createdEntry) =>
            pipe(
              ProjectRepo.update(pool)(projectId, userId, {
                total_seconds: newTotalSeconds,
              }),
              TE.map((updatedProject) => ({
                project: updatedProject,
                entry: createdEntry,
              }))
            )
          )
        );
      })
    );

// Update time entry hours
export const updateTimeEntryHours =
  ({ pool }: TimeEntryServiceDeps) =>
  (
    entryId: string,
    userId: string,
    hours: number
  ): AsyncResult<any, { entry: TimeEntry; project: Project }> =>
    pipe(
      TE.fromEither(validateManualEntry({ hours })),
      TE.chain(() => TimeEntryRepo.findById(pool)(entryId, userId)),
      TE.chain((entry) => {
        const newSeconds = hoursToSeconds(hours);
        const difference = calculateEntryDifference(entry.seconds, hours);

        return pipe(
          ProjectRepo.findById(pool)(entry.project_id, userId),
          TE.chain((project) => {
            const newTotalSeconds = updateProjectTotalSeconds(
              project.total_seconds,
              difference
            );

            return pipe(
              TimeEntryRepo.updateSeconds(pool)(entryId, userId, newSeconds),
              TE.chain((updatedEntry) =>
                pipe(
                  ProjectRepo.update(pool)(entry.project_id, userId, {
                    total_seconds: newTotalSeconds,
                  }),
                  TE.map((updatedProject) => ({
                    entry: updatedEntry,
                    project: updatedProject,
                  }))
                )
              )
            );
          })
        );
      })
    );

// Delete time entry
export const deleteTimeEntry =
  ({ pool }: TimeEntryServiceDeps) =>
  (entryId: string, userId: string): AsyncResult<any, { project: Project }> =>
    pipe(
      TimeEntryRepo.findById(pool)(entryId, userId),
      TE.chain((entry) =>
        pipe(
          TimeEntryRepo.deleteById(pool)(entryId, userId),
          TE.chain(() => ProjectRepo.findById(pool)(entry.project_id, userId)),
          TE.chain((project) => {
            const newTotalSeconds = Math.max(0, project.total_seconds - entry.seconds);

            return pipe(
              ProjectRepo.update(pool)(entry.project_id, userId, {
                total_seconds: newTotalSeconds,
              }),
              TE.map((updatedProject) => ({ project: updatedProject }))
            );
          })
        )
      )
    );
