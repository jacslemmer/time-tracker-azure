import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as E from 'fp-ts/Either';
import { getContainers } from '../shared/cosmosClient';
import { extractUserFromHeader } from '../shared/auth';
import { Project } from '../shared/types';

export async function getProjects(
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
    const { projectsContainer } = getContainers();

    const { resources: projects } = await projectsContainer.items
      .query<Project>({
        query: 'SELECT * FROM c WHERE c.user_id = @userId ORDER BY c.created_at DESC',
        parameters: [{ name: '@userId', value: user.id }]
      })
      .fetchAll();

    return {
      status: 200,
      jsonBody: projects
    };
  } catch (error) {
    context.error('Get projects error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('projects-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'projects',
  handler: getProjects
});
