import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as E from 'fp-ts/Either';
import { getContainers } from '../shared/cosmosClient';
import { extractUserFromHeader } from '../shared/auth';
import { Project } from '../shared/types';

export async function deleteProject(
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

    // Verify ownership
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

    await projectsContainer.item(projectId, user.id).delete();

    return {
      status: 200,
      jsonBody: { success: true }
    };
  } catch (error) {
    context.error('Delete project error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('projects-delete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'projects/{id}',
  handler: deleteProject
});
