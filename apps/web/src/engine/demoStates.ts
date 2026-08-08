import { HR_SCRIPT, PROGRAMME, SAFETY_CEILING_BPM, SILENT_REST_EXTENSION_SEC, zoneFor } from './programme';
import { classify, rollingState } from './recovery';
import { ABORT_REASON, describePoorStreak, describeSilentExtension, OVERRIDE_COMPENSATION } from './rules';
import type { SessionState } from './sessionStore';
import type {
  AdaptationDecision,
  DemoJumpTarget,
  HrSample,
  HrStatus,
  RecoveryDelta,
  SetLog,
} from './types';

// Presenter insurance (#43). Every demo state is a complete, internally consistent
// snapshot: the HR trace, the recovery deltas, the set log and the adaptation log all
// come from one scripted timeline, so a screen jumped into shows honest numbers.
// The HR series here is generated with the same maths as hrSim (wobble omitted, so the
// deltas land on exactly the scripted 19 / 8 / 6).

// --- the scripted session timeline (seconds on the session clock) -----------------

type Segment = { kind: 'set' | 'rest'; n: number; from: number; to: number };

const SET_1: Segment = { kind: 'set', n: 1, from: 0, to: 148 };
const REST_1: Segment = { kind: 'rest', n: 1, from: 148, to: 238 };
const SET_2: Segment = { kind: 'set', n: 2, from: 238, to: 392 };
// Rest 2 runs long: the first poor recovery bought a silent +20 s (#26).
const REST_2: Segment = { kind: 'rest', n: 2, from: 392, to: 392 + 90 + SILENT_REST_EXTENSION_SEC };
const SET_3: Segment = { kind: 'set', n: 3, from: 502, to: 660 };
const REST_3: Segment = { kind: 'rest', n: 3, from: 660, to: 842 };

const SEGMENTS: readonly Segment[] = [SET_1, REST_1, SET_2, REST_2, SET_3, REST_3];
const SESSION_END_SEC = 842; // 14:02 — the duration tile on the summary

const REST_DROP_COMPLETION = 0.85;
const PEAKS: readonly number[] = HR_SCRIPT.setPeaks;
const DROPS: readonly number[] = HR_SCRIPT.restDrops;

/** Per-second integer HR for the whole scripted session (index = session second). */
function buildSeries(): number[] {
  const out: number[] = [];
  let bpm: number = HR_SCRIPT.baseline;
  let restStart: number = HR_SCRIPT.baseline;
  let prevKey = '';

  for (let sec = 0; sec <= SESSION_END_SEC; sec++) {
    const seg = SEGMENTS.find((s) => sec >= s.from && sec < s.to);
    const key = seg ? `${seg.kind}${seg.n}` : 'idle';
    if (key !== prevKey) {
      if (seg?.kind === 'rest') {
        restStart = Math.round(bpm); // latch exactly like hrSim does
        bpm = restStart;
      }
      prevKey = key;
    }

    let target: number = HR_SCRIPT.baseline;
    let tau: number = HR_SCRIPT.recoveryTauSec;
    if (seg?.kind === 'set') {
      target = PEAKS[seg.n - 1] ?? HR_SCRIPT.baseline;
      tau = HR_SCRIPT.climbTauSec;
    } else if (seg?.kind === 'rest') {
      target = restStart - (DROPS[seg.n - 1] ?? 0) / REST_DROP_COMPLETION;
    }

    bpm += (target - bpm) * (1 - Math.exp(-1 / tau));
    out.push(Math.round(bpm));
  }
  return out;
}

const SERIES = buildSeries();

function bpmAt(sec: number): number {
  const i = Math.max(0, Math.min(SERIES.length - 1, Math.round(sec)));
  return SERIES[i] ?? HR_SCRIPT.baseline;
}

function hrAt(sec: number, connected = true): HrStatus {
  const bpm = bpmAt(sec);
  return { current: bpm, zone: zoneFor(bpm), connected, source: 'replay' };
}

/** The 1 Hz tail a live screen would have on hand (chart + "last 45 s" strip). */
function tailSamples(endSec: number, seconds = 45): HrSample[] {
  const out: HrSample[] = [];
  for (let sec = Math.max(0, endSec - seconds + 1); sec <= endSec; sec++) {
    out.push({ t: sec * 1000, bpm: bpmAt(sec) });
  }
  return out;
}

/** ~60 samples spread across the whole session, so the summary average is real. */
function sessionSamples(endSec: number, everySec = 14): HrSample[] {
  const out: HrSample[] = [];
  for (let sec = 0; sec <= endSec; sec += everySec) out.push({ t: sec * 1000, bpm: bpmAt(sec) });
  return out;
}

/** The forced ceiling breach, same maths as hrSim.forceBreach(). */
function breachTail(endSec: number, seconds = 8): HrSample[] {
  const out: HrSample[] = [];
  let bpm = Math.max(bpmAt(endSec - seconds), SAFETY_CEILING_BPM - 8);
  for (let i = seconds - 1; i >= 0; i--) {
    bpm += (SAFETY_CEILING_BPM + 6 - bpm) * (1 - Math.exp(-1 / 4));
    out.push({ t: (endSec - i) * 1000, bpm: Math.round(bpm) });
  }
  return out;
}

// --- scripted facts ---------------------------------------------------------------

function deltaFor(seg: Segment): RecoveryDelta {
  const hrAtRestStart = bpmAt(seg.from - 1);
  const hrAt60s = bpmAt(seg.from + 59); // 60 one-second steps into the window
  const delta = hrAtRestStart - hrAt60s;
  return { setNumber: seg.n, hrAtRestStart, hrAt60s, delta, state: classify(delta, true) };
}

const DELTA_1 = deltaFor(REST_1); // −19 good
const DELTA_2 = deltaFor(REST_2); // −8  poor  → silent extension
const DELTA_3 = deltaFor(REST_3); // −6  poor  → cut proposed

function pendingDelta(seg: Segment): RecoveryDelta {
  return {
    setNumber: seg.n,
    hrAtRestStart: bpmAt(seg.from - 1),
    hrAt60s: null,
    delta: null,
    state: 'unknown',
  };
}

function completedSet(n: number, seg: Segment, rir: number): SetLog {
  return {
    setNumber: n,
    targetReps: PROGRAMME.targetReps,
    repsCompleted: PROGRAMME.targetReps,
    loadKg: PROGRAMME.loadKg,
    rir,
    startedAt: seg.from * 1000,
    endedAt: seg.to * 1000,
  };
}

function inProgressSet(n: number, seg: Segment, reps: number): SetLog {
  return {
    setNumber: n,
    targetReps: PROGRAMME.targetReps,
    repsCompleted: reps,
    loadKg: PROGRAMME.loadKg,
    rir: null,
    startedAt: seg.from * 1000,
    endedAt: null,
  };
}

const SET_1_LOG = completedSet(1, SET_1, 2);
const SET_2_LOG = completedSet(2, SET_2, 1);
const SET_3_LOG = completedSet(3, SET_3, 0);

const SILENT_EXTENSION: AdaptationDecision = {
  id: 'demo-extend-rest-2',
  at: (REST_2.from + 60) * 1000,
  setNumber: 2,
  kind: 'extend_rest',
  trigger: describeSilentExtension(2, DELTA_2.delta),
  detail: { addedRestSec: SILENT_REST_EXTENSION_SEC },
  status: 'auto',
  compensation: null,
};

const CUT_PROPOSED: AdaptationDecision = {
  id: 'demo-cut-sets-3',
  at: (REST_3.from + 60) * 1000,
  setNumber: 3,
  kind: 'cut_sets',
  trigger: describePoorStreak([DELTA_2, DELTA_3]),
  detail: { setsCut: 1 },
  status: 'proposed',
  compensation: null,
};

const CUT_ACCEPTED: AdaptationDecision = { ...CUT_PROPOSED, status: 'accepted' };
const CUT_OVERRIDDEN: AdaptationDecision = {
  ...CUT_PROPOSED,
  status: 'overridden',
  compensation: OVERRIDE_COMPENSATION,
};

// --- snapshots --------------------------------------------------------------------

/**
 * The pristine session. Also the demo rig's 'idle' jump and the store's initial state,
 * so there is exactly one definition of "nothing has happened yet".
 */
export function createInitialState(): SessionState {
  return {
    phase: 'idle',
    programme: PROGRAMME,
    currentSet: 0,
    sets: [],
    plannedSetsDynamic: PROGRAMME.plannedSets,
    sessionClock: 0,
    sessionStartedAt: null,
    speed: 1,
    rest: {
      endsAtClock: null,
      secondsLeft: 0,
      warned20: false,
      rpeAsked: false,
      frozen: false,
      startedAtClock: null,
      hrAtStart: 0,
    },
    hr: {
      current: HR_SCRIPT.baseline,
      zone: zoneFor(HR_SCRIPT.baseline),
      connected: true,
      source: 'replay',
    },
    samples: [],
    recovery: { deltas: [], rolling: 'unknown' },
    adaptations: [],
    pendingAdaptation: null,
    telemetry: [],
    muted: false,
    agentActive: false,
    micAlwaysOn: true,
    aborted: null,
  };
}

const SET_SNAPSHOT_SEC = 384; // mid set 2
const REST_SNAPSHOT_SEC = 427; // 35 s into rest 2 → 55 s left
const ADAPT_SNAPSHOT_SEC = 720; // 60 s into rest 3, sheet just opened
const OVERRIDE_SNAPSHOT_SEC = 740; // sheet resolved 20 s later
const ABORT_SNAPSHOT_SEC = 602; // 100 s into set 3

const ADAPT_REST_SECONDS_LEFT = 62;
const OVERRIDE_REST_SECONDS_LEFT = 30;

/**
 * A full, coherent state for a demo jump. `telemetry`, `muted`, `speed` and
 * `agentActive` are deliberately left out so the presenter's rig settings survive
 * a jump; everything a screen renders is included.
 */
export function buildDemoState(target: DemoJumpTarget): Partial<SessionState> {
  switch (target) {
    case 'idle':
      return createInitialState();

    case 'set': {
      const clock = SET_SNAPSHOT_SEC * 1000;
      return {
        phase: 'set',
        programme: PROGRAMME,
        currentSet: 2,
        sets: [SET_1_LOG, inProgressSet(2, SET_2, 4)],
        plannedSetsDynamic: PROGRAMME.plannedSets,
        sessionClock: clock,
        sessionStartedAt: Date.now() - clock,
        rest: { ...createInitialState().rest },
        hr: hrAt(SET_SNAPSHOT_SEC),
        samples: tailSamples(SET_SNAPSHOT_SEC),
        recovery: { deltas: [DELTA_1], rolling: rollingState([DELTA_1]) },
        adaptations: [],
        pendingAdaptation: null,
        aborted: null,
      };
    }

    case 'rest': {
      const clock = REST_SNAPSHOT_SEC * 1000;
      const deltas = [DELTA_1, pendingDelta(REST_2)];
      return {
        phase: 'rest',
        programme: PROGRAMME,
        currentSet: 2,
        // RIR still open — the rest window is where it gets captured (#17).
        sets: [SET_1_LOG, { ...SET_2_LOG, rir: null }],
        plannedSetsDynamic: PROGRAMME.plannedSets,
        sessionClock: clock,
        sessionStartedAt: Date.now() - clock,
        rest: {
          endsAtClock: (REST_2.from + PROGRAMME.restSeconds) * 1000,
          secondsLeft: 55,
          warned20: false,
          rpeAsked: true,
          frozen: false,
          startedAtClock: REST_2.from * 1000,
          hrAtStart: DELTA_2.hrAtRestStart,
        },
        hr: hrAt(REST_SNAPSHOT_SEC),
        samples: tailSamples(REST_SNAPSHOT_SEC),
        recovery: { deltas, rolling: rollingState(deltas) },
        adaptations: [],
        pendingAdaptation: null,
        aborted: null,
      };
    }

    case 'adapt': {
      const clock = ADAPT_SNAPSHOT_SEC * 1000;
      const deltas = [DELTA_1, DELTA_2, DELTA_3];
      return {
        phase: 'rest',
        programme: PROGRAMME,
        currentSet: 3,
        sets: [SET_1_LOG, SET_2_LOG, SET_3_LOG],
        plannedSetsDynamic: PROGRAMME.plannedSets,
        sessionClock: clock,
        sessionStartedAt: Date.now() - clock,
        rest: {
          // Frozen: the countdown holds while the sheet is unresolved (#28).
          endsAtClock: clock + ADAPT_REST_SECONDS_LEFT * 1000,
          secondsLeft: ADAPT_REST_SECONDS_LEFT,
          warned20: false,
          rpeAsked: true,
          frozen: true,
          startedAtClock: REST_3.from * 1000,
          hrAtStart: DELTA_3.hrAtRestStart,
        },
        hr: hrAt(ADAPT_SNAPSHOT_SEC),
        samples: tailSamples(ADAPT_SNAPSHOT_SEC),
        recovery: { deltas, rolling: rollingState(deltas) },
        adaptations: [SILENT_EXTENSION],
        pendingAdaptation: CUT_PROPOSED,
        aborted: null,
      };
    }

    case 'override': {
      const clock = OVERRIDE_SNAPSHOT_SEC * 1000;
      const deltas = [DELTA_1, DELTA_2, DELTA_3];
      return {
        phase: 'rest',
        programme: PROGRAMME,
        currentSet: 3,
        sets: [SET_1_LOG, SET_2_LOG, SET_3_LOG],
        // Overridden: the fourth set survives, capped at six reps.
        plannedSetsDynamic: PROGRAMME.plannedSets,
        sessionClock: clock,
        sessionStartedAt: Date.now() - clock,
        rest: {
          endsAtClock: clock + OVERRIDE_REST_SECONDS_LEFT * 1000,
          secondsLeft: OVERRIDE_REST_SECONDS_LEFT,
          warned20: false,
          rpeAsked: true,
          frozen: false,
          startedAtClock: REST_3.from * 1000,
          hrAtStart: DELTA_3.hrAtRestStart,
        },
        hr: hrAt(OVERRIDE_SNAPSHOT_SEC),
        samples: tailSamples(OVERRIDE_SNAPSHOT_SEC),
        recovery: { deltas, rolling: rollingState(deltas) },
        adaptations: [SILENT_EXTENSION, CUT_OVERRIDDEN],
        pendingAdaptation: null,
        aborted: null,
      };
    }

    case 'abort': {
      const clock = ABORT_SNAPSHOT_SEC * 1000;
      const deltas = [DELTA_1, DELTA_2];
      const samples = [
        ...tailSamples(ABORT_SNAPSHOT_SEC - 8, 37),
        ...breachTail(ABORT_SNAPSHOT_SEC),
      ];
      const hrAtAbort = samples.at(-1)?.bpm ?? SAFETY_CEILING_BPM + 4;
      return {
        phase: 'aborted',
        programme: PROGRAMME,
        currentSet: 3,
        sets: [SET_1_LOG, SET_2_LOG, inProgressSet(3, SET_3, 5)],
        plannedSetsDynamic: PROGRAMME.plannedSets,
        sessionClock: clock,
        sessionStartedAt: Date.now() - clock,
        rest: { ...createInitialState().rest },
        hr: { current: hrAtAbort, zone: zoneFor(hrAtAbort), connected: true, source: 'replay' },
        samples,
        recovery: { deltas, rolling: rollingState(deltas) },
        adaptations: [SILENT_EXTENSION],
        pendingAdaptation: null,
        aborted: { reason: ABORT_REASON, hrAtAbort },
      };
    }

    case 'summary':
    case 'log': {
      const clock = SESSION_END_SEC * 1000;
      const deltas = [DELTA_1, DELTA_2, DELTA_3];
      return {
        phase: 'complete',
        programme: PROGRAMME,
        currentSet: 3,
        sets: [SET_1_LOG, SET_2_LOG, SET_3_LOG],
        // The cut was accepted: three sets was the plan by the end.
        plannedSetsDynamic: 3,
        sessionClock: clock,
        sessionStartedAt: Date.now() - clock,
        rest: { ...createInitialState().rest },
        hr: hrAt(SESSION_END_SEC),
        samples: sessionSamples(SESSION_END_SEC),
        recovery: { deltas, rolling: rollingState(deltas) },
        adaptations: [SILENT_EXTENSION, CUT_ACCEPTED],
        pendingAdaptation: null,
        aborted: null,
      };
    }
  }
}
