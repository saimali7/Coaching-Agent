import type { CoachContext } from '../engine/types';

// The agent may only speak numbers that exist in this context (#36). Everything
// is serialized to strings because ElevenLabs dynamic variables are templated
// into the system prompt verbatim.

/** Millisecond clock → "m:ss" for spoken/templated durations. */
function clockMss(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export type SessionTiming = {
  /** Session clock in milliseconds. */
  sessionClockMs?: number;
  /** Seconds elapsed in the current working set; 0 outside a set. */
  setElapsedSeconds?: number;
};

export function toDynamicVariables(
  ctx: CoachContext,
  timing?: SessionTiming,
): Record<string, string | number | boolean> {
  return {
    phase: ctx.phase,
    movement: ctx.movement,
    load_kg: ctx.loadKg,
    completed_set: ctx.completedSet,
    planned_sets: ctx.plannedSets,
    remaining_sets: ctx.remainingSets,
    target_reps: ctx.targetReps,
    last_set_reps: ctx.lastSetReps,
    last_set_rir: ctx.lastSetRir === null ? 'unknown' : ctx.lastSetRir,
    current_hr: ctx.currentHr,
    zone: ctx.zone,
    recovery_states: ctx.recoveryStates.length ? ctx.recoveryStates.join(', ') : 'none',
    last_recovery_delta:
      ctx.lastRecoveryDelta === null ? 'none' : `-${Math.abs(ctx.lastRecoveryDelta)}`,
    pending_adaptation: ctx.pendingAdaptation
      ? `${ctx.pendingAdaptation.kind} (${ctx.pendingAdaptation.trigger})`
      : 'none',
    safety_ceiling: ctx.safetyCeilingBpm,
    rest_seconds_left: ctx.restSecondsLeft,
    session_clock: clockMss(timing?.sessionClockMs ?? 0),
    set_elapsed_seconds: String(timing?.setElapsedSeconds ?? 0),
  };
}

/** Mid-rest context refresh, sent as a contextual update (does not interrupt). */
export function toContextualUpdate(ctx: CoachContext): string {
  const lines = [
    `Rest window update. Completed set ${ctx.completedSet} of ${ctx.plannedSets}; ${ctx.remainingSets} remaining.`,
    `Last set: ${ctx.lastSetReps} reps at ${ctx.loadKg} kg, reps in reserve ${ctx.lastSetRir ?? 'unknown'}.`,
    `Heart rate ${ctx.currentHr} bpm, zone ${ctx.zone}. Recovery so far: ${
      ctx.recoveryStates.join(', ') || 'none'
    }.`,
    ctx.pendingAdaptation
      ? `Pending adaptation: ${ctx.pendingAdaptation.kind} — ${ctx.pendingAdaptation.trigger}.`
      : 'No pending adaptation.',
    `${ctx.restSecondsLeft} seconds of rest remain.`,
  ];
  return lines.join(' ');
}

/**
 * Always-live session feed: one compact sentence-cased line the agent receives
 * whenever the live numbers move (and on the connected heartbeat). Plain text,
 * no JSON — the agent may repeat only what is written here (#36).
 */
export function toLiveUpdate(ctx: CoachContext, timing?: SessionTiming): string {
  const parts: string[] = [`Live: phase ${ctx.phase}`];

  if (ctx.phase === 'set') {
    parts.push(`set ${ctx.completedSet} of ${ctx.plannedSets}`);
    parts.push(`rep ${ctx.lastSetReps} of ${ctx.targetReps}`);
    if (timing?.setElapsedSeconds !== undefined) {
      parts.push(`set elapsed ${timing.setElapsedSeconds}s`);
    }
  } else if (ctx.phase === 'rest') {
    parts.push(`${ctx.restSecondsLeft}s rest left after set ${ctx.completedSet} of ${ctx.plannedSets}`);
    parts.push(`last set ${ctx.lastSetReps} reps, RIR ${ctx.lastSetRir ?? 'unknown'}`);
    parts.push(`recovery ${ctx.recoveryStates.join(', ') || 'none'}`);
  } else {
    parts.push(`set ${ctx.completedSet} of ${ctx.plannedSets}`);
  }

  parts.push(`HR ${ctx.currentHr} zone ${ctx.zone}`);
  parts.push(`session ${clockMss(timing?.sessionClockMs ?? 0)}`);

  let line = `${parts.join(', ')}.`;
  if (ctx.pendingAdaptation) {
    line += ` Pending adaptation: ${ctx.pendingAdaptation.kind} — ${ctx.pendingAdaptation.trigger}.`;
  }
  return line;
}
