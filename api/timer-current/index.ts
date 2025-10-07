import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as E from 'fp-ts/Either';
import { getContainers } from '../shared/cosmosClient';
import { extractUserFromHeader } from '../shared/auth';
import { Project } from '../shared/types';

export async function getCurrentTimer(
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
    const { projectsContainer } = getContainers();

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
    const isRunning = project.timer_running;
    const seconds = isRunning && project.timer_start_time
      ? Math.floor((Date.now() - project.timer_start_time) / 1000)
      : 0;

    return {
      status: 200,
      jsonBody: {
        isRunning,
        seconds
      }
    };
  } catch (error) {
    context.error('Get current timer error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('timer-current', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'projects/{id}/timer/current',
  handler: getCurrentTimer
});
