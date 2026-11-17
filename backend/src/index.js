import { createApp } from './app.js';
import { env, getCapabilities } from './config/env.js';
import { startScheduler, stopScheduler } from './services/scheduler/scheduler.js';

const app = createApp();
const capabilities = getCapabilities();

const server = app.listen(env.port, () => {
  console.log(`\n[TechPulse API] Listening on http://localhost:${env.port}`);
  console.log(`[TechPulse API] Timezone: ${env.tz}`);
  console.log(`[TechPulse API] Capabilities:`, JSON.stringify(capabilities));
  startScheduler();
});

function shutdown(signal) {
  console.log(`\n[TechPulse API] Received ${signal}. Shutting down cleanly...`);
  stopScheduler();
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
