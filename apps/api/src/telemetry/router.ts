import { Router } from 'express';
import { z } from 'zod';

const MAX_EVENTS = 5000;

const telemetryEventSchema = z.object({
  id: z.string(),
  at: z.number(),
  sessionClock: z.number(),
  type: z.string(),
  data: z.record(z.string(), z.unknown()).optional(),
});

const telemetryBatchSchema = z.object({
  events: z.array(telemetryEventSchema).max(500),
});

const events: unknown[] = [];

export const telemetryRouter: Router = Router();

telemetryRouter.post('/', (req, res) => {
  const parsed = telemetryBatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid telemetry payload', issues: z.treeifyError(parsed.error) });
  }

  events.push(...parsed.data.events);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }

  const counts = new Map<string, number>();
  for (const event of parsed.data.events) {
    counts.set(event.type, (counts.get(event.type) ?? 0) + 1);
  }
  const types = [...counts.entries()].map(([type, n]) => `${type}×${n}`).join(', ');
  console.log(`[telemetry] +${parsed.data.events.length} (total ${events.length}) types: ${types}`);

  res.status(202).json({ accepted: parsed.data.events.length });
});

telemetryRouter.get('/', (_req, res) => {
  res.json({ events });
});

telemetryRouter.delete('/', (_req, res) => {
  events.length = 0;
  res.status(204).end();
});
