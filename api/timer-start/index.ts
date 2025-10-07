import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as E from 'fp-ts/Either';
import { getContainers } from '../shared/cosmosClient';
import { extractUserFromHeader } from '../shared/auth';
import { Project } from '../shared/types';

export async function startTimer(
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

    if (project.timer_running) {
      return {
        status: 400,
        jsonBody: { error: 'Timer already running' }
      };
    }

    // Start timer
    const updatedProject: Project = {
      ...project,
      timer_running: true,
      timer_start_time: Date.now()
    };

    await projectsContainer.item(project.id, user.id).replace(updatedProject);

    return {
      status: 200,
      jsonBody: updatedProject
    };
  } catch (error) {
    context.error('Start timer error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('timer-start', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'projects/{id}/timer/start',
  handler: startTimer
});
