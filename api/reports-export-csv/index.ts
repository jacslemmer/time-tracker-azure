import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as E from 'fp-ts/Either';
import { extractUserFromHeader } from '../shared/auth';

export async function exportCSV(
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

    const body = await request.json() as { data: any[] };
    const { data } = body;

    if (!data || data.length === 0) {
      return {
        status: 400,
        jsonBody: { error: 'No data provided' }
      };
    }

    // Generate CSV
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          const stringValue = value !== null && value !== undefined ? String(value) : '';
          // Escape quotes and wrap in quotes if contains comma
          return stringValue.includes(',') || stringValue.includes('"')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        }).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');

    return {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=report.csv'
      },
      body: csvContent
    };
  } catch (error) {
    context.error('Export CSV error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('reports-export-csv', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'reports/export/csv',
  handler: exportCSV
});
