import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as E from 'fp-ts/Either';
import { getContainers } from '../shared/cosmosClient';
import { extractUserFromHeader } from '../shared/auth';
import { Project, TimeEntry } from '../shared/types';

const hoursToSeconds = (hours: number): number => Math.floor(hours * 3600);

export async function addManualEntry(
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
    const projectId = request.params.id;
    const body = await request.json() as { hours: number };
    const { hours } = body;

    if (hours < 0.01) {
      return {
        status: 400,
        jsonBody: { error: 'Hours must be at least 0.01' }
      };
    }

    const { projectsContainer, timeEntriesContainer } = getContainers();

    // Get project
    const { resources } = await projectsContainer.items
      .query<Project>({
        query: 'SELECT * FROM c WHERE c.id = @id AND c.user_id = @userId',
        parameters: [
          { name: '@id', value: projectId },
          { name: '@userId', value: user.id }
        ]
      })
      .fetchAll();

    if (resources.length === 0) {
      return {
        status: 404,
        jsonBody: { error: 'Project not found' }
      };
    }

    const project = resources[0];
    const timestamp = Date.now();
    const seconds = hoursToSeconds(hours);

    // Create manual time entry
    const timeEntry: TimeEntry = {
      id: `entry-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      project_id: projectId,
      user_id: user.id,
      seconds,
      start_time: timestamp,
      end_time: timestamp,
      is_manual: true,
      created_at: new Date().toISOString()
    };

    await timeEntriesContainer.items.create(timeEntry);

    // Update project total
    const updatedProject: Project = {
      ...project,
      total_seconds: project.total_seconds + seconds
    };

    await projectsContainer.item(project.id, user.id).replace(updatedProject);

    return {
      status: 201,
      jsonBody: {
        project: updatedProject,
        entry: timeEntry
      }
    };
  } catch (error) {
    context.error('Add manual entry error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('timeentries-add-manual', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'time-entries/{id}/manual',
  handler: addManualEntry
});
