import { POOR_STREAK_TO_CUT } from './programme';
import { computedDeltas, formatDrop } from './recovery';
import type { RecoveryDelta } from './types';

// The rules engine (#25, #29). Pure: same deltas in, same decision out — no store,
// no clock, no audio, no model. The rule decides; the agent only reports the decision.

/** Named compensation offered when the athlete overrides the cut (#30). */
export const OVERRIDE_COMPENSATION = 'Final set capped at 6 reps';
/** The rep cap that compensation actually applies. */
export const OVERRIDE_REP_CAP = 6;
/** Reason recorded on a safety abort (#23). */
export const ABORT_REASON = 'Heart rate above ceiling';

export type RuleContext = {
  /** A cut has already been proposed (or resolved) this session — never propose twice. */
  alreadyProposedCut: boolean;
  /** This rest window already received the silent extension. */
  alreadyExtendedThisRest: boolean;
  /** Sets still to come after the current one. */
  remainingSets: number;
};

export type RuleOutcome = {
  /** The only unannounced adaptation (#26): a quiet +20 s on the first poor rest. */
  silentExtension?: boolean;
  /** Announced, athlete-resolvable: cut the remaining sets. */
  proposeCut?: { trigger: string };
};

const COUNT_WORDS: Record<number, string> = { 2: 'two', 3: 'three', 4: 'four' };

function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n);
}

/** "Recovery poor on two consecutive rests (−8, −6)" — real numbers only. */
export function describePoorStreak(streak: readonly RecoveryDelta[]): string {
  const drops = streak.map((d) => formatDrop(d.delta)).join(', ');
  return `Recovery poor on ${countWord(streak.length)} consecutive rests (${drops})`;
}

/** "Recovery poor after set 2 (−8 bpm in 60 s)" — the trigger behind a silent extension. */
export function describeSilentExtension(setNumber: number, delta: number | null): string {
  return `Recovery poor after set ${setNumber} (${formatDrop(delta)} bpm in 60 s)`;
}

/**
 * Evaluate the adaptation rules against every measured rest so far.
 * 'unknown' rests (strap off, window not closed) are ignored entirely — a missing
 * measurement must never look like a bad one.
 */
export function evaluate(deltas: readonly RecoveryDelta[], ctx: RuleContext): RuleOutcome {
  const measured = computedDeltas(deltas);
  const latest = measured.at(-1);
  if (!latest || latest.state !== 'poor') return {};

  // Rule 1 (#25): POOR_STREAK_TO_CUT consecutive poor rests → propose cutting the rest of the session.
  const streak = measured.slice(-POOR_STREAK_TO_CUT);
  const streakIsPoor =
    streak.length === POOR_STREAK_TO_CUT && streak.every((d) => d.state === 'poor');
  if (streakIsPoor && !ctx.alreadyProposedCut && ctx.remainingSets > 0) {
    return { proposeCut: { trigger: describePoorStreak(streak) } };
  }

  // Rule 2 (#26): the *first* poor rest of a run buys a silent +20 s. Once the streak
  // is established the answer is the cut, not more quiet padding.
  const previous = measured.at(-2);
  if (previous?.state !== 'poor' && !ctx.alreadyExtendedThisRest) {
    return { silentExtension: true };
  }

  return {};
}
