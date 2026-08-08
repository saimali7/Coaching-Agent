import type { Programme } from './types';

// Hardcoded programme (#2): one movement, 4 sets × 8 reps, 60 kg, 90 s rests.
export const PROGRAMME: Programme = {
  movement: 'Barbell back squat',
  loadKg: 60,
  targetReps: 8,
  plannedSets: 4,
  restSeconds: 90,
};

// Zone model (#18): age-formula max HR for the MVP, user-overridable later.
// Age-based max HR is wrong by ±10–12 bpm — acceptable because nothing
// safety-critical keys off the zone number.
export const ATHLETE_AGE = 30;
export const MAX_HR = 220 - ATHLETE_AGE; // 190

/** Zone lower bounds as fractions of max HR (zones 1–5). */
export const ZONE_BOUNDS = [0.5, 0.6, 0.7, 0.8, 0.9] as const;

export function zoneFor(bpm: number): number {
  let zone = 0;
  ZONE_BOUNDS.forEach((f, i) => {
    if (bpm >= f * MAX_HR) zone = i + 1;
  });
  return zone;
}

// Safety ceiling (#23): absolute bpm, deliberately NOT zone-derived.
export const SAFETY_CEILING_BPM = 182;

// Recovery delta classification (#21): HR drop in the first 60 s of rest.
export const RECOVERY_WINDOW_MS = 60_000;
export const RECOVERY_GOOD_MIN = 15; // delta ≥ 15 → good
export const RECOVERY_OK_MIN = 10; //  10–14 → ok, < 10 → poor

// Adaptation rules (#25, #29):
export const POOR_STREAK_TO_CUT = 2; // two consecutive poor rests → cut remaining sets
export const SILENT_REST_EXTENSION_SEC = 20; // first poor rest → silent extension (never announced)

// Rest timing (#4, #11)
export const REST_WARNING_SEC = 20; // talking timer warning
export const REST_SECONDS = PROGRAMME.restSeconds;

// Deterministic HR replay script (#17): the demo's centrepiece cannot depend on
// the presenter's pulse. Per-set peaks climb; recovery at 60 s degrades so the
// deltas read good → poor → poor and the cut fires in rest 3 exactly.
export const HR_SCRIPT = {
  baseline: 88,
  /** Peak bpm approached during each working set (1-indexed by set number). */
  setPeaks: [143, 152, 158, 163] as const,
  /** Scripted HR drop achieved 60 s into each rest → good, poor, poor, poor. */
  restDrops: [19, 8, 6, 5] as const,
  /** Seconds of work needed to climb ~63% of the way to the set peak. */
  climbTauSec: 25,
  /** Seconds of rest needed to complete ~63% of the scripted drop. */
  recoveryTauSec: 32,
  /** Deterministic wobble so the trace looks alive (no RNG — replays identically). */
  wobbleAmp: 1.6,
  wobblePeriodSec: 7,
} as const;
