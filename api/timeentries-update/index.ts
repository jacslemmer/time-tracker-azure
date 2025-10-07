import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as E from 'fp-ts/Either';
import { getContainers } from '../shared/cosmosClient';
import { extractUserFromHeader } from '../shared/auth';
import { Project, TimeEntry } from '../shared/types';

const hoursToSeconds = (hours: number): number => Math.floor(hours * 3600);

export async function updateTimeEntry(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const authResult = extractUserFromHeader(request.headers.get('authorization') || '');

    if (E.isLeft(authResult)) {
      return {
        status: 401,
        jsonBody: { error: authResult.left }
      };
    }

    const user = authResult.right;
    const entryId = request.params.id;
    const body = await request.json() as { hours: number };
    const { hours } = body;

    if (hours < 0.01) {
      return {
        status: 400,
        jsonBody: { error: 'Hours must be at least 0.01' }
      };
    }

    const { projectsContainer, timeEntriesContainer } = getContainers();

    // Get time entry
    const { resources: entries } = await timeEntriesContainer.items
      .query<TimeEntry>({
        query: 'SELECT * FROM c WHERE c.id = @id AND c.user_id = @userId',
        parameters: [
          { name: '@id', value: entryId },
          { name: '@userId', value: user.id }
        ]
      })
      .fetchAll();

    if (entries.length === 0) {
      return {
        status: 404,
        jsonBody: { error: 'Time entry not found' }
      };
    }

    const entry = entries[0];
    const oldSeconds = entry.seconds;
    const newSeconds = hoursToSeconds(hours);
    const difference = newSeconds - oldSeconds;

    // Update entry
    const updatedEntry: TimeEntry = {
      ...entry,
      seconds: newSeconds
    };

    await timeEntriesContainer.item(entry.id, user.id).replace(updatedEntry);

    // Update project total
    const { resources: projects } = await projectsContainer.items
      .query<Project>({
        query: 'SELECT * FROM c WHERE c.id = @id AND c.user_id = @userId',
        parameters: [
          { name: '@id', value: entry.project_id },
          { name: '@userId', value: user.id }
        ]
      })
      .fetchAll();

    if (projects.length > 0) {
      const project = projects[0];
      const updatedProject: Project = {
        ...project,
        total_seconds: Math.max(0, project.total_seconds + difference)
      };
      await projectsContainer.item(project.id, user.id).replace(updatedProject);

      return {
        status: 200,
        jsonBody: {
          success: true,
          project: updatedProject
        }
      };
    }

    return {
      status: 200,
      jsonBody: { success: true }
    };
  } catch (error) {
    context.error('Update time entry error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('timeentries-update', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'time-entries/{id}',
  handler: updateTimeEntry
});
