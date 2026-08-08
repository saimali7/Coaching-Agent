import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { env } from './env.js';
import { sessionsRouter } from './sessions/router.js';
import { voiceRouter } from './voice/router.js';
import { telemetryRouter } from './telemetry/router.js';

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/sessions', sessionsRouter);
  app.use('/api/voice', voiceRouter);
  app.use('/api/telemetry', telemetryRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Single-origin mode: serve the built frontend from the API so one tunnel
  // (ngrok) or one container port covers the whole app. Off unless the build
  // exists, so development keeps using the Vite dev server and its proxy.
  const webDist = env.webDist ?? join(process.cwd(), '../web/dist');
  if (existsSync(join(webDist, 'index.html'))) {
    app.use(express.static(webDist, { index: false, maxAge: '1h' }));
    // The router owns /summary and /log, so any non-asset GET returns the shell.
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      res.sendFile(join(webDist, 'index.html'));
    });
    console.log(`Serving the web build from ${webDist}`);
  }

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use(errorHandler);

  return app;
}
