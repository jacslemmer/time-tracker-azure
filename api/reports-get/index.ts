import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as E from 'fp-ts/Either';
import { getContainers } from '../shared/cosmosClient';
import { extractUserFromHeader } from '../shared/auth';
import { Project, TimeEntry } from '../shared/types';

const secondsToHours = (seconds: number): number => Number((seconds / 3600).toFixed(2));

export async function getReports(
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
    const type = request.query.get('type') || 'all';
    const dateFilter = request.query.get('dateFilter') || 'all';
    const startDate = request.query.get('startDate');
    const endDate = request.query.get('endDate');

    const { projectsContainer, timeEntriesContainer } = getContainers();

    // Get all projects
    const { resources: projects } = await projectsContainer.items
      .query<Project>({
        query: 'SELECT * FROM c WHERE c.user_id = @userId',
        parameters: [{ name: '@userId', value: user.id }]
      })
      .fetchAll();

    // Get all time entries
    const { resources: timeEntries } = await timeEntriesContainer.items
      .query<TimeEntry>({
        query: 'SELECT * FROM c WHERE c.user_id = @userId',
        parameters: [{ name: '@userId', value: user.id }]
      })
      .fetchAll();

    // Filter by date
    let filteredEntries = timeEntries;
    if (dateFilter === 'custom' && startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      filteredEntries = timeEntries.filter(entry => {
        const entryDate = entry.start_time;
        return entryDate >= start && entryDate <= end;
      });
    }

    // Generate report based on type
    let reportData: any[] = [];

    if (type === 'all') {
      // All entries with project details
      reportData = filteredEntries.map(entry => {
        const project = projects.find(p => p.id === entry.project_id);
        return {
          date: new Date(entry.start_time).toLocaleDateString(),
          project: project?.name || 'Unknown',
          client: project?.client_name || '',
          hours: secondsToHours(entry.seconds),
          rate: project?.hourly_rate || 0,
          amount: secondsToHours(entry.seconds) * (project?.hourly_rate || 0),
          isManual: entry.is_manual
        };
      });
    } else if (type === 'by-client') {
      // Group by client
      const clientMap = new Map<string, { hours: number; amount: number }>();

      filteredEntries.forEach(entry => {
        const project = projects.find(p => p.id === entry.project_id);
        const client = project?.client_name || 'No Client';
        const hours = secondsToHours(entry.seconds);
        const amount = hours * (project?.hourly_rate || 0);

        if (clientMap.has(client)) {
          const existing = clientMap.get(client)!;
          clientMap.set(client, {
            hours: existing.hours + hours,
            amount: existing.amount + amount
          });
        } else {
          clientMap.set(client, { hours, amount });
        }
      });

      reportData = Array.from(clientMap.entries()).map(([client, data]) => ({
        client,
        hours: data.hours,
        amount: data.amount
      }));
    } else if (type === 'by-project') {
      // Group by project
      const projectMap = new Map<string, {
        client: string;
        hours: number;
        rate: number;
        amount: number;
      }>();

      filteredEntries.forEach(entry => {
        const project = projects.find(p => p.id === entry.project_id);
        const projectName = project?.name || 'Unknown';
        const hours = secondsToHours(entry.seconds);
        const amount = hours * (project?.hourly_rate || 0);

        if (projectMap.has(projectName)) {
          const existing = projectMap.get(projectName)!;
          projectMap.set(projectName, {
            ...existing,
            hours: existing.hours + hours,
            amount: existing.amount + amount
          });
        } else {
          projectMap.set(projectName, {
            client: project?.client_name || '',
            hours,
            rate: project?.hourly_rate || 0,
            amount
          });
        }
      });

      reportData = Array.from(projectMap.entries()).map(([project, data]) => ({
        project,
        client: data.client,
        hours: data.hours,
        rate: data.rate,
        amount: data.amount
      }));
    }

    return {
      status: 200,
      jsonBody: reportData
    };
  } catch (error) {
    context.error('Get reports error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('reports-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'reports',
  handler: getReports
});
