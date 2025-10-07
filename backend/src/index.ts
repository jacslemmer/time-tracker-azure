// Re-export from functional implementation
export { createApp, startServer } from './index.functional';

// Start server when this is the main module
if (require.main === module) {
  const { startServer } = require('./index.functional');
  const port = parseInt(process.env.PORT || '3000', 10);
  startServer(port);
}
