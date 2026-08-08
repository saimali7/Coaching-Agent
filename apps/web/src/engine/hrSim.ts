import { HR_SCRIPT, SAFETY_CEILING_BPM } from './programme';
import type { SessionPhase } from './types';

// Deterministic HR replay (#17). The centrepiece of the demo cannot depend on the
// presenter's pulse, so there is no RNG anywhere in this file: the same taps in the
// same order always produce the same trace, and the same deltas.
//
// Shape: first-order approach to a phase-dependent target,
//   bpm += (target − bpm) · (1 − e^(−dt/τ))
// plus a small deterministic sine wobble so the trace looks alive.

export type HrSimInput = {
  phase: SessionPhase;
  setNumber: number;
  /** Session clock in ms at the moment being sampled. */
  clockMs: number;
  /** Ms elapsed in the current rest window (0 outside rest). Kept for callers/tests. */
  restElapsedMs: number;
};

export type HrSimPrime = {
  bpm: number;
  phase: SessionPhase;
  setNumber: number;
  /** HR the current rest started from — needed so a demo jump into REST keeps dropping honestly. */
  restStartBpm?: number;
};

/**
 * Rest targets overshoot the scripted drop by this fraction so that the drop is
 * ~complete at the 60 s measurement: 1 − e^(−60/32) = 0.847 ≈ 0.85.
 * Result: the measured delta equals HR_SCRIPT.restDrops[n] almost exactly.
 */
const REST_DROP_COMPLETION = 0.85;
/** Wobble is damped in rest so it cannot smear the 60 s recovery measurement. */
const REST_WOBBLE_DAMP = 0.35;
/** Post-session drift back to baseline. */
const DRIFT_TAU_SEC = 45;
/** Forced-breach target and time constant (demo rig). */
const FORCED_TARGET_BPM = SAFETY_CEILING_BPM + 6;
const FORCED_TAU_SEC = 4;
/**
 * A breach is a surge, not a slow climb: the demo cannot wait 40 s of exponential.
 * forceBreach() starts the climb from here so the ceiling is crossed in ~4 s.
 */
const FORCED_SURGE_FLOOR_BPM = SAFETY_CEILING_BPM - 8;
/** Guard against huge clock jumps (demo speed, tab wake). */
const MAX_STEP_SEC = 5;

const PEAKS: readonly number[] = HR_SCRIPT.setPeaks;
const DROPS: readonly number[] = HR_SCRIPT.restDrops;

type SimState = {
  /** Smooth, unrounded state. */
  lastBpm: number;
  /** Last integer actually handed out — what the store stores and the athlete sees. */
  lastEmitted: number;
  lastClockMs: number | null;
  prevPhase: SessionPhase;
  prevSet: number;
  /** Latched at rest entry so the scripted drop is measured from the number on screen. */
  restStartBpm: number;
  /** Clock at the current segment boundary — anchors the wobble phase. */
  segmentStartMs: number;
  forced: boolean;
};

function freshState(): SimState {
  return {
    lastBpm: HR_SCRIPT.baseline,
    lastEmitted: HR_SCRIPT.baseline,
    lastClockMs: null,
    prevPhase: 'idle',
    prevSet: 0,
    restStartBpm: HR_SCRIPT.baseline,
    segmentStartMs: 0,
    forced: false,
  };
}

let state: SimState = freshState();

function clamp(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n;
}

function setPeak(setNumber: number): number {
  return PEAKS[setNumber - 1] ?? PEAKS[PEAKS.length - 1] ?? HR_SCRIPT.baseline;
}

function restDrop(setNumber: number): number {
  return DROPS[setNumber - 1] ?? DROPS[DROPS.length - 1] ?? 0;
}

function targetFor(phase: SessionPhase, setNumber: number): { target: number; tauSec: number } {
  if (state.forced) return { target: FORCED_TARGET_BPM, tauSec: FORCED_TAU_SEC };
  switch (phase) {
    case 'set':
      return { target: setPeak(setNumber), tauSec: HR_SCRIPT.climbTauSec };
    case 'rest':
      return {
        target: state.restStartBpm - restDrop(setNumber) / REST_DROP_COMPLETION,
        tauSec: HR_SCRIPT.recoveryTauSec,
      };
    case 'idle':
      return { target: HR_SCRIPT.baseline, tauSec: HR_SCRIPT.recoveryTauSec };
    case 'complete':
    case 'aborted':
      return { target: HR_SCRIPT.baseline, tauSec: DRIFT_TAU_SEC };
  }
}

export const hrSim = {
  /** Back to the pristine baseline (session reset / demo jump to idle). */
  reset(): void {
    state = freshState();
  },

  /**
   * Continue the trace from a known value — used after a demo state jump so the
   * simulator does not snap back and contradict the screen.
   */
  prime(input: HrSimPrime): void {
    const bpm = Math.round(input.bpm);
    state = {
      ...freshState(),
      lastBpm: bpm,
      lastEmitted: bpm,
      prevPhase: input.phase,
      prevSet: input.setNumber,
      restStartBpm: input.restStartBpm ?? bpm,
    };
  },

  /** Demo rig: drive HR past the safety ceiling (#23) in ~4 s. */
  forceBreach(): void {
    state.forced = true;
    state.lastBpm = Math.max(state.lastBpm, FORCED_SURGE_FLOOR_BPM);
  },

  /** One 1 Hz sample. Integer bpm; phase/set transitions are detected internally. */
  sample(input: HrSimInput): number {
    const { phase, setNumber, clockMs } = input;

    const dtSec =
      state.lastClockMs === null ? 1 : clamp((clockMs - state.lastClockMs) / 1000, 0, MAX_STEP_SEC);
    state.lastClockMs = clockMs;

    if (phase !== state.prevPhase || setNumber !== state.prevSet) {
      state.segmentStartMs = clockMs;
      if (phase === 'rest') {
        // Latch the number the store recorded as hrAtRestStart, so the measured
        // delta is exactly the scripted drop rather than the scripted drop ± wobble.
        state.restStartBpm = state.lastEmitted;
        state.lastBpm = state.lastEmitted;
      }
      state.prevPhase = phase;
      state.prevSet = setNumber;
    }

    const { target, tauSec } = targetFor(phase, setNumber);
    state.lastBpm += (target - state.lastBpm) * (1 - Math.exp(-dtSec / tauSec));

    const amp = HR_SCRIPT.wobbleAmp * (phase === 'rest' && !state.forced ? REST_WOBBLE_DAMP : 1);
    const wobbleSec = (clockMs - state.segmentStartMs) / 1000;
    const wobble = Math.sin((2 * Math.PI * wobbleSec) / HR_SCRIPT.wobblePeriodSec) * amp;

    state.lastEmitted = Math.round(state.lastBpm + wobble);
    return state.lastEmitted;
  },
};
