import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as E from 'fp-ts/Either';
import { extractUserFromHeader } from '../shared/auth';

export async function exportJSON(
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

    const jsonContent = JSON.stringify(data, null, 2);

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename=report.json'
      },
      body: jsonContent
    };
  } catch (error) {
    context.error('Export JSON error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('reports-export-json', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'reports/export/json',
  handler: exportJSON
});
