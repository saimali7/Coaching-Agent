import { RECOVERY_GOOD_MIN, RECOVERY_OK_MIN } from './programme';
import type { RecoveryDelta, RecoveryState } from './types';

// Recovery delta (#21): the HR drop achieved in the first 60 s of a rest window.
// This is the only physiological signal the rules engine is allowed to key off,
// so the classification lives in one pure function with no store access.

/**
 * Classify a 60 s recovery delta.
 * No strap (or no measurement yet) is 'unknown' — never guessed, and 'unknown'
 * is deliberately not 'poor' so a dropped strap can never trigger an adaptation.
 */
export function classify(delta: number | null, connected: boolean): RecoveryState {
  if (!connected || delta === null || !Number.isFinite(delta)) return 'unknown';
  if (delta >= RECOVERY_GOOD_MIN) return 'good';
  if (delta >= RECOVERY_OK_MIN) return 'ok';
  return 'poor';
}

/** A delta counts as "computed" once the 60 s window closed with a live strap. */
export function isComputed(d: RecoveryDelta): boolean {
  return d.delta !== null && d.state !== 'unknown';
}

/** Only the rests that actually produced a measurement, in order. */
export function computedDeltas(deltas: readonly RecoveryDelta[]): RecoveryDelta[] {
  return deltas.filter(isComputed);
}

/** States of the computed rests — what the agent is allowed to say out loud. */
export function computedStates(deltas: readonly RecoveryDelta[]): RecoveryState[] {
  return computedDeltas(deltas).map((d) => d.state);
}

/** The most recent measured rest, or null when nothing has been measured yet. */
export function lastComputedDelta(deltas: readonly RecoveryDelta[]): RecoveryDelta | null {
  return computedDeltas(deltas).at(-1) ?? null;
}

/** Rolling recovery state = the state of the most recent measured rest. */
export function rollingState(deltas: readonly RecoveryDelta[]): RecoveryState {
  return lastComputedDelta(deltas)?.state ?? 'unknown';
}

/** Signed display form of a drop: 19 → "−19" (U+2212, matches the cue script). */
export function formatDrop(delta: number | null): string {
  return delta === null ? '—' : `−${Math.abs(delta)}`;
}
