import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as E from 'fp-ts/Either';
import { getContainers } from '../shared/cosmosClient';
import { extractUserFromHeader } from '../shared/auth';
import { TimeEntry } from '../shared/types';

export async function getTimeEntries(
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
    const projectId = request.query.get('projectId');
    const { timeEntriesContainer } = getContainers();

    let query = 'SELECT * FROM c WHERE c.user_id = @userId ORDER BY c.created_at DESC';
    const parameters: any[] = [{ name: '@userId', value: user.id }];

    if (projectId) {
      query = 'SELECT * FROM c WHERE c.user_id = @userId AND c.project_id = @projectId ORDER BY c.created_at DESC';
      parameters.push({ name: '@projectId', value: projectId });
    }

    const { resources: timeEntries } = await timeEntriesContainer.items
      .query<TimeEntry>({ query, parameters })
      .fetchAll();

    return {
      status: 200,
      jsonBody: timeEntries
    };
  } catch (error) {
    context.error('Get time entries error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('timeentries-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'time-entries',
  handler: getTimeEntries
});
