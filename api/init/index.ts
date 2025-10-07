import { app, HttpRequest, HttpResponseInit, InvocationContext, Timer } from '@azure/functions';
import { initializeCosmosDB } from '../shared/cosmosClient';

let initialized = false;

export async function init(
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  if (!initialized) {
    context.log('Initializing Cosmos DB...');
    try {
      await initializeCosmosDB();
      initialized = true;
      context.log('Cosmos DB initialized successfully');
    } catch (error) {
      context.error('Failed to initialize Cosmos DB:', error);
    }
  }
}

// Run on startup (timer trigger that runs once)
app.timer('init', {
  schedule: '0 */30 * * * *', // Every 30 minutes as keepalive
  handler: init
});

// Also provide HTTP endpoint for manual initialization
export async function initHttp(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    await initializeCosmosDB();
    initialized = true;
    return {
      status: 200,
      jsonBody: { message: 'Cosmos DB initialized successfully' }
    };
  } catch (error) {
    context.error('Initialization error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to initialize Cosmos DB' }
    };
  }
}

app.http('init-http', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'init',
  handler: initHttp
});
