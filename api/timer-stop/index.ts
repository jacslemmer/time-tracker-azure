import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as E from 'fp-ts/Either';
import { getContainers } from '../shared/cosmosClient';
import { extractUserFromHeader } from '../shared/auth';
import { Project, TimeEntry } from '../shared/types';

export async function stopTimer(
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

    if (!project.timer_running || !project.timer_start_time) {
      return {
        status: 400,
        jsonBody: { error: 'Timer not running' }
      };
    }

    const endTime = Date.now();
    const startTime = project.timer_start_time;
    const seconds = Math.floor((endTime - startTime) / 1000);

    // Create time entry
    const timeEntry: TimeEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      project_id: projectId,
      user_id: user.id,
      seconds,
      start_time: startTime,
      end_time: endTime,
      is_manual: false,
      created_at: new Date().toISOString()
    };

    await timeEntriesContainer.items.create(timeEntry);

    // Update project
    const updatedProject: Project = {
      ...project,
      timer_running: false,
      timer_start_time: null,
      total_seconds: project.total_seconds + seconds
    };

    await projectsContainer.item(project.id, user.id).replace(updatedProject);

    return {
      status: 200,
      jsonBody: {
        project: updatedProject,
        entry: timeEntry
      }
    };
  } catch (error) {
    context.error('Stop timer error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('timer-stop', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'projects/{id}/timer/stop',
  handler: stopTimer
});
