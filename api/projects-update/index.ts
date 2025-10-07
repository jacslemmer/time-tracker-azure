import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as E from 'fp-ts/Either';
import { getContainers } from '../shared/cosmosClient';
import { extractUserFromHeader } from '../shared/auth';
import { Project } from '../shared/types';

export async function updateProject(
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
    const body = await request.json() as Partial<{
      name: string;
      clientName: string;
      hourlyRate: number;
      budget: number;
    }>;

    const { projectsContainer } = getContainers();

    // Get existing project
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

    // Update fields
    const updatedProject: Project = {
      ...project,
      name: body.name !== undefined ? body.name : project.name,
      client_name: body.clientName !== undefined ? body.clientName : project.client_name,
      hourly_rate: body.hourlyRate !== undefined ? parseFloat(body.hourlyRate.toString()) : project.hourly_rate,
      budget: body.budget !== undefined ? parseFloat(body.budget.toString()) : project.budget
    };

    await projectsContainer.item(project.id, user.id).replace(updatedProject);

    return {
      status: 200,
      jsonBody: updatedProject
    };
  } catch (error) {
    context.error('Update project error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('projects-update', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'projects/{id}',
  handler: updateProject
});
