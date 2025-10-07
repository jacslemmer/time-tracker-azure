import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as E from 'fp-ts/Either';
import { getContainers } from '../shared/cosmosClient';
import { extractUserFromHeader } from '../shared/auth';
import { Project, Warning } from '../shared/types';

const secondsToHours = (seconds: number): number => seconds / 3600;

export async function getWarnings(
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

    // Get all projects
    const { resources: projects } = await projectsContainer.items
      .query<Project>({
        query: 'SELECT * FROM c WHERE c.user_id = @userId',
        parameters: [{ name: '@userId', value: user.id }]
      })
      .fetchAll();

    const warnings: Warning[] = [];

    for (const project of projects) {
      const totalHours = secondsToHours(project.total_seconds);
      const percentUsed = project.budget > 0 ? (totalHours * project.hourly_rate / project.budget) * 100 : 0;

      // Budget warnings
      if (percentUsed >= 100) {
        warnings.push({
          id: `warning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          user_id: user.id,
          project_id: project.id,
          type: 'BUDGET_100',
          message: `Project "${project.name}" has exceeded budget! (${percentUsed.toFixed(0)}% used)`,
          created_at: new Date().toISOString(),
          dismissed: false
        });
      } else if (percentUsed >= 90) {
        warnings.push({
          id: `warning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          user_id: user.id,
          project_id: project.id,
          type: 'BUDGET_90',
          message: `Project "${project.name}" is at ${percentUsed.toFixed(0)}% of budget`,
          created_at: new Date().toISOString(),
          dismissed: false
        });
      }

      // Long session warning
      if (project.timer_running && project.timer_start_time) {
        const runningHours = (Date.now() - project.timer_start_time) / (1000 * 3600);
        if (runningHours >= 8) {
          warnings.push({
            id: `warning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            user_id: user.id,
            project_id: project.id,
            type: 'LONG_SESSION',
            message: `Timer for "${project.name}" has been running for ${runningHours.toFixed(1)} hours`,
            created_at: new Date().toISOString(),
            dismissed: false
          });
        }
      }
    }

    return {
      status: 200,
      jsonBody: warnings
    };
  } catch (error) {
    context.error('Get warnings error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('warnings-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'warnings',
  handler: getWarnings
});
