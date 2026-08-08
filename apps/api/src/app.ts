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

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use(errorHandler);

  return app;
}
