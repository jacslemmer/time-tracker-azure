import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as E from 'fp-ts/Either';
import { getContainers } from '../shared/cosmosClient';
import { extractUserFromHeader } from '../shared/auth';
import { Project } from '../shared/types';

export async function createProject(
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
    const body = await request.json() as {
      name: string;
      clientName: string;
      hourlyRate: number;
      budget: number;
    };

    const { name, clientName, hourlyRate, budget } = body;

    // Validation
    if (!name || hourlyRate < 0 || budget < 0) {
      return {
        status: 400,
        jsonBody: { error: 'Invalid project data' }
      };
    }

    const { projectsContainer } = getContainers();

    const newProject: Project = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.id,
      name,
      client_name: clientName || '',
      hourly_rate: parseFloat(hourlyRate.toString()),
      budget: parseFloat(budget.toString()),
      total_seconds: 0,
      timer_running: false,
      timer_start_time: null,
      created_at: new Date().toISOString()
    };

    await projectsContainer.items.create(newProject);

    return {
      status: 201,
      jsonBody: newProject
    };
  } catch (error) {
    context.error('Create project error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('projects-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'projects',
  handler: createProject
});
