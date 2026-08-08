import type { TelemetryEvent, TelemetryType } from './types';

// Telemetry (#44). Metrics with no instrumentation are decoration — but instrumentation
// that can break a session is worse than none. Everything here is fire-and-forget:
// batched, silently caught, capped, and never awaited by the engine.

const ENDPOINT = '/api/telemetry';
const FLUSH_INTERVAL_MS = 5_000; // real time, deliberately not the demo clock
/** Server accepts max 500 events per batch; the queue is capped to the same number. */
const MAX_QUEUED_EVENTS = 500;

let queue: TelemetryEvent[] = [];
let flushHandle: ReturnType<typeof setInterval> | null = null;
let inFlight = false;
let idCounter = 0;

/** crypto.randomUUID with a deterministic fallback (it is undefined outside secure contexts). */
export function uid(prefix = 'id'): string {
  const c: Crypto | undefined = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export function makeEvent(
  type: TelemetryType,
  sessionClock: number,
  data?: Record<string, unknown>,
): TelemetryEvent {
  return {
    id: uid('tel'),
    at: Date.now(),
    sessionClock,
    type,
    ...(data === undefined ? {} : { data }),
  };
}

function cap(events: TelemetryEvent[]): TelemetryEvent[] {
  return events.length > MAX_QUEUED_EVENTS ? events.slice(events.length - MAX_QUEUED_EVENTS) : events;
}

export function enqueueTelemetry(event: TelemetryEvent): void {
  queue = cap([...queue, event]);
  startTelemetryFlusher();
}

/** Post everything queued. Failures re-queue (oldest dropped first) and stay silent. */
export function flushTelemetry(): void {
  if (inFlight || queue.length === 0) return;
  if (typeof fetch !== 'function') return;

  const batch = queue;
  queue = [];
  inFlight = true;

  void fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events: batch }),
    keepalive: true,
  })
    .then((res) => {
      if (!res.ok) queue = cap([...batch, ...queue]);
    })
    .catch(() => {
      // Network loss must never break a session (#39) — keep the events for the next flush.
      queue = cap([...batch, ...queue]);
    })
    .finally(() => {
      inFlight = false;
    });
}

export function startTelemetryFlusher(): void {
  if (flushHandle !== null) return;
  flushHandle = setInterval(flushTelemetry, FLUSH_INTERVAL_MS);
}

export function stopTelemetryFlusher(): void {
  if (flushHandle === null) return;
  clearInterval(flushHandle);
  flushHandle = null;
}

/** Test/debug hook: what is still waiting to be sent. */
export function pendingTelemetryCount(): number {
  return queue.length;
}
