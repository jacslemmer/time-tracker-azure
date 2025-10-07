import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as E from 'fp-ts/Either';
import { getContainers } from '../shared/cosmosClient';
import { extractUserFromHeader } from '../shared/auth';
import { Project, TimeEntry } from '../shared/types';

export async function deleteTimeEntry(
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
    const entryId = request.params.id;
    const { projectsContainer, timeEntriesContainer } = getContainers();

    // Get time entry
    const { resources: entries } = await timeEntriesContainer.items
      .query<TimeEntry>({
        query: 'SELECT * FROM c WHERE c.id = @id AND c.user_id = @userId',
        parameters: [
          { name: '@id', value: entryId },
          { name: '@userId', value: user.id }
        ]
      })
      .fetchAll();

    if (entries.length === 0) {
      return {
        status: 404,
        jsonBody: { error: 'Time entry not found' }
      };
    }

    const entry = entries[0];

    // Delete entry
    await timeEntriesContainer.item(entry.id, user.id).delete();

    // Update project total
    const { resources: projects } = await projectsContainer.items
      .query<Project>({
        query: 'SELECT * FROM c WHERE c.id = @id AND c.user_id = @userId',
        parameters: [
          { name: '@id', value: entry.project_id },
          { name: '@userId', value: user.id }
        ]
      })
      .fetchAll();

    if (projects.length > 0) {
      const project = projects[0];
      const updatedProject: Project = {
        ...project,
        total_seconds: Math.max(0, project.total_seconds - entry.seconds)
      };
      await projectsContainer.item(project.id, user.id).replace(updatedProject);

      return {
        status: 200,
        jsonBody: {
          success: true,
          project: updatedProject
        }
      };
    }

    return {
      status: 200,
      jsonBody: { success: true }
    };
  } catch (error) {
    context.error('Delete time entry error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('timeentries-delete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'time-entries/{id}',
  handler: deleteTimeEntry
});
