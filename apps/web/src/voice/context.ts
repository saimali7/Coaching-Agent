import type { CoachContext } from '../engine/types';

// The agent may only speak numbers that exist in this context (#36). Everything
// is serialized to strings because ElevenLabs dynamic variables are templated
// into the system prompt verbatim.

export function toDynamicVariables(ctx: CoachContext): Record<string, string | number | boolean> {
  return {
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
