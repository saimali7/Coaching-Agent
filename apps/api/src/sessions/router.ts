import { Router } from 'express';
import { z } from 'zod';
import { createSession, deleteSession, getSession, listSessions } from './store.js';

const newSessionSchema = z.object({
  title: z.string().min(1).max(120),
  coachee: z.string().min(1).max(120),
  notes: z.string().max(2000).default(''),
  scheduledAt: z.iso.datetime(),
});

export const sessionsRouter: Router = Router();

sessionsRouter.get('/', (_req, res) => {
  res.json({ sessions: listSessions() });
});

sessionsRouter.get('/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ session });
});

sessionsRouter.post('/', (req, res) => {
  const parsed = newSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid session payload', issues: z.treeifyError(parsed.error) });
  }
  res.status(201).json({ session: createSession(parsed.data) });
});

sessionsRouter.delete('/:id', (req, res) => {
  if (!deleteSession(req.params.id)) return res.status(404).json({ error: 'Session not found' });
  res.status(204).end();
});
