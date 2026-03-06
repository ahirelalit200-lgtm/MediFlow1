/**
 * Root bridge for local development and Render deployments.
 * Imports the main Express application from the Vercel-native entry point.
 */
const app = require('./api/index');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Bridge Server listening on port ${PORT}`);
  console.log(`📡 Deployment Environment: ${process.env.NODE_ENV || 'development'}`);
});