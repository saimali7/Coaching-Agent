import { create } from 'zustand';
import { CUE_IDS, GO_EARCON, countCue, cue } from '../audio/cueScript';
import type { CueId } from '../audio/cueScript';
import { buildDemoState, createInitialState } from './demoStates';
import { hrSim } from './hrSim';
import {
  RECOVERY_WINDOW_MS,
  REST_WARNING_SEC,
  SAFETY_CEILING_BPM,
  SILENT_REST_EXTENSION_SEC,
  zoneFor,
} from './programme';
import { classify, computedStates, lastComputedDelta } from './recovery';
import {
  ABORT_REASON,
  OVERRIDE_COMPENSATION,
  OVERRIDE_REP_CAP,
  describeSilentExtension,
  evaluate,
} from './rules';
import { enqueueTelemetry, flushTelemetry, makeEvent, startTelemetryFlusher, uid } from './telemetry';
import type {
  AdaptationDecision,
  CoachContext,
  CueRequest,
  DemoSpeed,
  DemoJumpTarget,
  HrSample,
  HrStatus,
  Programme,
  RecoveryDelta,
  RecoveryState,
  SessionPhase,
  SetLog,
  TelemetryEvent,
  TelemetryType,
} from './types';

// The session engine (#1). One store, one state machine, one clock:
//   idle → set ⇄ rest → complete, with aborted reachable from set/rest.
// It owns every number the UI, the cues and the voice agent are allowed to show or say.
// It knows nothing about React, audio playback or ElevenLabs — those attach through
// the module-level sinks below.

const TICK_MS = 200;
const MAX_SAMPLES = 4000;
/** Never replay more than this many HR seconds in one tick (tab wake, 12× speed). */
const MAX_CATCHUP_SEC = 30;
/** Seconds into a rest before the RPE question is asked (#17). */
const RPE_ASK_AFTER_MS = 8_000;
/** Three consecutive samples over the ceiling before the abort protocol runs (#23). */
const CEILING_STREAK_TO_ABORT = 3;

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export type RestState = {
  endsAtClock: number | null;
  secondsLeft: number;
  warned20: boolean;
  rpeAsked: boolean;
  /** True while an unresolved adaptation sheet holds the countdown. */
  frozen: boolean;
  startedAtClock: number | null;
  hrAtStart: number;
};

export type SessionState = {
  phase: SessionPhase;
  programme: Programme;
  /** 1-based; 0 before the session starts. */
  currentSet: number;
  sets: SetLog[];
  /** Planned sets after any accepted cut. */
  plannedSetsDynamic: number;
  sessionClock: number;
  sessionStartedAt: number | null;
  speed: DemoSpeed;
  rest: RestState;
  hr: HrStatus;
  samples: HrSample[];
  recovery: { deltas: RecoveryDelta[]; rolling: RecoveryState };
  adaptations: AdaptationDecision[];
  pendingAdaptation: AdaptationDecision | null;
  telemetry: TelemetryEvent[];
  muted: boolean;
  agentActive: boolean;
  aborted: { reason: string; hrAtAbort: number } | null;
};

export type SessionSummary = {
  volumeKg: number;
  avgHr: number;
  durationMs: number;
  setsCompleted: number;
  setsPlanned: number;
};

export type DemoRoute = '/' | '/summary' | '/log';

export type SessionActions = {
  startSession: () => void;
  startSet: (n: number) => void;
  logRep: () => void;
  endSet: () => void;
  enterRest: () => void;
  exitRest: () => void;
  skipRest: () => void;
  extendRest: (seconds: number, opts?: { silent?: boolean }) => void;
  captureRir: (n: number) => void;
  computeRecoveryForCurrentRest: () => void;
  acceptAdaptation: () => void;
  overrideAdaptation: () => void;
  completeSession: () => void;
  triggerAbort: () => void;
  breachCeiling: () => void;
  dropStrap: () => void;
  toggleMute: () => void;
  setSpeed: (s: DemoSpeed) => void;
  setAgentActive: (b: boolean) => void;
  track: (type: TelemetryType, data?: Record<string, unknown>) => void;
  resetSession: () => void;
  demoJump: (target: DemoJumpTarget) => DemoRoute;
  getSummary: () => SessionSummary;
};

export type SessionStore = SessionState & SessionActions;

// ---------------------------------------------------------------------------
// Sinks — the engine stays decoupled from audio and from the voice agent
// ---------------------------------------------------------------------------

type CueSink = (cueRequest: CueRequest) => void;
type RestSinks = {
  /** Fired on every REST entry, after the state is committed (#34). */
  onRestEnter: (ctx: CoachContext) => void;
  /** Fired on every REST exit, including aborts and demo jumps (#33). */
  onRestExit: () => void;
};

let cueSink: CueSink | null = null;
let restSinks: RestSinks | null = null;

export function setCueSink(fn: CueSink | null): void {
  cueSink = fn;
}

export function setRestSinks(sinks: RestSinks | null): void {
  restSinks = sinks;
}

/**
 * Every spoken line in the session goes through here.
 * Muted still counts the cue (#42) — the telemetry has to show what the athlete
 * did not hear — and 'critical' (safety) is never suppressed.
 */
function emitCue(request: CueRequest): void {
  const store = useSessionStore.getState();
  if (store.muted && request.priority !== 'critical') {
    store.track('cue_played', { id: request.id, suppressed: true });
    return;
  }
  cueSink?.(request);
  store.track('cue_played', { id: request.id });
}

function setupCue(n: number, capped: boolean): CueRequest | null {
  // A capped set gets its own line — announcing "eight reps" after conceding a
  // six-rep compensation would be the coach contradicting itself.
  const id = capped ? `setup_set_${n}_capped` : `setup_set_${n}`;
  if ((CUE_IDS as readonly string[]).includes(id)) return cue(id as CueId);
  return capped ? setupCue(n, false) : null;
}

// ---------------------------------------------------------------------------
// Coach context (#34, #36) — the only numbers the agent may speak
// ---------------------------------------------------------------------------

export function buildCoachContext(s: SessionState): CoachContext {
  const lastSet = s.sets.at(-1);
  const remainingSets = Math.max(0, s.plannedSetsDynamic - s.currentSet);
  const pending = s.pendingAdaptation;
  return {
    movement: s.programme.movement,
    loadKg: s.programme.loadKg,
    completedSet: s.currentSet,
    plannedSets: s.plannedSetsDynamic,
    remainingSets,
    targetReps: lastSet?.targetReps ?? s.programme.targetReps,
    lastSetReps: lastSet?.repsCompleted ?? 0,
    lastSetRir: lastSet?.rir ?? null,
    restSecondsLeft: s.rest.secondsLeft,
    currentHr: s.hr.current,
    zone: s.hr.zone,
    recoveryStates: computedStates(s.recovery.deltas),
    lastRecoveryDelta: lastComputedDelta(s.recovery.deltas)?.delta ?? null,
    pendingAdaptation: pending
      ? {
          kind: pending.kind,
          trigger: pending.trigger,
          detail: pending.detail,
          status: pending.status,
        }
      : null,
    adaptationsSoFar: s.adaptations.map((a) => ({
      kind: a.kind,
      trigger: a.trigger,
      status: a.status,
      compensation: a.compensation,
    })),
    safetyCeilingBpm: SAFETY_CEILING_BPM,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSessionStore = create<SessionStore>()((set, get) => ({
  ...createInitialState(),

  startSession: () => {
    if (get().phase !== 'idle') return;
    hrSim.reset();
    set({ sessionStartedAt: Date.now(), sessionClock: 0 });
    get().track('session_start');
    startEngineTicker();
    get().startSet(1);
  },

  startSet: (n) => {
    const s = get();
    // An override keeps the final set but caps it — the named compensation (#30).
    const overrideActive = s.adaptations.some(
      (a) => a.kind === 'cut_sets' && a.status === 'overridden',
    );
    const targetReps =
      overrideActive && n === s.plannedSetsDynamic ? OVERRIDE_REP_CAP : s.programme.targetReps;

    set((st) => ({
      phase: 'set',
      currentSet: n,
      sets: [
        ...st.sets,
        {
          setNumber: n,
          targetReps,
          repsCompleted: 0,
          loadKg: st.programme.loadKg,
          rir: null,
          startedAt: st.sessionClock,
          endedAt: null,
        },
      ],
    }));

    get().track('set_start', { set: n, targetReps });
    const setup = setupCue(n, targetReps !== s.programme.targetReps);
    if (setup) emitCue(setup);
    // 'normal' so the go signal queues behind the setup line instead of stepping on it (#9).
    emitCue({ ...GO_EARCON, priority: 'normal' });
  },

  logRep: () => {
    const s = get();
    if (s.phase !== 'set') return;
    const index = s.sets.length - 1;
    const current = s.sets[index];
    if (!current) return;

    const rep = current.repsCompleted + 1;
    set((st) => ({
      sets: st.sets.map((entry, i) => (i === index ? { ...entry, repsCompleted: rep } : entry)),
    }));
    get().track('rep_logged', { set: current.setNumber, rep });

    // Only the last three reps are counted out loud (#10).
    if (rep > current.targetReps - 3) {
      const count = countCue(rep);
      if (count) emitCue(count);
    }
    if (rep >= current.targetReps) get().endSet();
  },

  endSet: () => {
    const s = get();
    const index = s.sets.length - 1;
    const current = s.sets[index];
    set((st) => ({
      sets: st.sets.map((entry, i) =>
        i === index ? { ...entry, endedAt: st.sessionClock } : entry,
      ),
    }));
    get().track('set_end', { set: s.currentSet, reps: current?.repsCompleted ?? 0 });

    if (s.currentSet >= s.plannedSetsDynamic) get().completeSession();
    else get().enterRest();
  },

  enterRest: () => {
    const s = get();
    const endsAtClock = s.sessionClock + s.programme.restSeconds * 1000;
    set((st) => ({
      phase: 'rest',
      rest: {
        endsAtClock,
        secondsLeft: st.programme.restSeconds,
        warned20: false,
        rpeAsked: false,
        frozen: false,
        startedAtClock: st.sessionClock,
        hrAtStart: st.hr.current,
      },
      recovery: {
        ...st.recovery,
        deltas: [
          ...st.recovery.deltas,
          {
            setNumber: st.currentSet,
            hrAtRestStart: st.hr.current,
            hrAt60s: null,
            delta: null,
            state: 'unknown' as RecoveryState,
          },
        ],
      },
    }));

    emitCue(cue('set_done'));
    get().track('rest_start', { set: s.currentSet });
    restSinks?.onRestEnter(buildCoachContext(get()));
  },

  exitRest: () => {
    const s = get();
    emitCue(cue('rest_zero'));
    get().track('rest_end');
    restSinks?.onRestExit();
    get().startSet(s.currentSet + 1);
  },

  skipRest: () => {
    const s = get();
    if (s.phase !== 'rest') return;
    // An unresolved adaptation has to be answered before the next set starts —
    // otherwise the athlete walks into a set the plan no longer agrees with.
    if (s.pendingAdaptation !== null) {
      get().track('agent_gate_blocked', { reason: 'skip_rest_with_pending_adaptation' });
      return;
    }
    get().track('rest_end', { skipped: true });
    restSinks?.onRestExit();
    get().startSet(s.currentSet + 1);
  },

  extendRest: (seconds, opts) => {
    set((st) => ({
      rest: {
        ...st.rest,
        endsAtClock: st.rest.endsAtClock === null ? null : st.rest.endsAtClock + seconds * 1000,
      },
    }));
    get().track('rest_extended', { seconds, silent: !!opts?.silent });
  },

  captureRir: (n) => {
    const s = get();
    // The last set with an end time is the one being talked about in this rest.
    let index = -1;
    s.sets.forEach((entry, i) => {
      if (entry.endedAt !== null) index = i;
    });
    if (index === -1) index = s.sets.length - 1;
    if (index < 0) return;

    set((st) => ({
      sets: st.sets.map((entry, i) => (i === index ? { ...entry, rir: n } : entry)),
      rest: { ...st.rest, rpeAsked: true },
    }));
    get().track('rpe_captured', { rir: n, set: s.sets[index]?.setNumber ?? s.currentSet });
    emitCue(cue('rpe_ack'));
  },

  computeRecoveryForCurrentRest: () => {
    const s = get();
    const index = s.recovery.deltas.length - 1;
    const pending = s.recovery.deltas[index];
    if (!pending || pending.delta !== null) return;

    const connected = s.hr.connected;
    const hrAt60s = connected ? s.hr.current : null;
    const delta = connected ? pending.hrAtRestStart - s.hr.current : null;
    const state = classify(delta, connected);

    set((st) => ({
      recovery: {
        deltas: st.recovery.deltas.map((d, i) =>
          i === index ? { ...d, hrAt60s, delta, state } : d,
        ),
        rolling: state,
      },
    }));

    const next = get();
    const outcome = evaluate(next.recovery.deltas, {
      alreadyProposedCut:
        next.pendingAdaptation?.kind === 'cut_sets' ||
        next.adaptations.some((a) => a.kind === 'cut_sets'),
      alreadyExtendedThisRest: next.adaptations.some(
        (a) => a.kind === 'extend_rest' && a.setNumber === next.currentSet,
      ),
      remainingSets: Math.max(0, next.plannedSetsDynamic - next.currentSet),
    });

    if (outcome.silentExtension) {
      // The only unannounced adaptation (#26): it is logged, never spoken.
      get().extendRest(SILENT_REST_EXTENSION_SEC, { silent: true });
      const decision: AdaptationDecision = {
        id: uid('adapt'),
        at: next.sessionClock,
        setNumber: next.currentSet,
        kind: 'extend_rest',
        trigger: describeSilentExtension(next.currentSet, delta),
        detail: { addedRestSec: SILENT_REST_EXTENSION_SEC },
        status: 'auto',
        compensation: null,
      };
      set((st) => ({ adaptations: [...st.adaptations, decision] }));
      get().track('adaptation_proposed', { kind: 'extend_rest', auto: true });
    }

    if (outcome.proposeCut) {
      const after = get();
      const decision: AdaptationDecision = {
        id: uid('adapt'),
        at: after.sessionClock,
        setNumber: after.currentSet,
        kind: 'cut_sets',
        trigger: outcome.proposeCut.trigger,
        detail: { setsCut: Math.max(0, after.plannedSetsDynamic - after.currentSet) },
        status: 'proposed',
        compensation: null,
      };
      // Freeze the countdown: the athlete decides, the timer waits (#28).
      set((st) => ({ pendingAdaptation: decision, rest: { ...st.rest, frozen: true } }));
      emitCue(cue('adapt_cut'));
      get().track('adaptation_proposed', { kind: 'cut_sets' });
    }
  },

  acceptAdaptation: () => {
    const pending = get().pendingAdaptation;
    if (!pending) return;
    const decision: AdaptationDecision = { ...pending, status: 'accepted' };
    set((st) => ({
      adaptations: [...st.adaptations, decision],
      pendingAdaptation: null,
      plannedSetsDynamic: st.currentSet,
      rest: { ...st.rest, frozen: false },
    }));
    get().track('adaptation_accepted', { kind: decision.kind });
    emitCue(cue('adapt_accept_ack'));
    get().completeSession();
  },

  overrideAdaptation: () => {
    const pending = get().pendingAdaptation;
    if (!pending) return;
    const decision: AdaptationDecision = {
      ...pending,
      status: 'overridden',
      compensation: OVERRIDE_COMPENSATION,
    };
    set((st) => ({
      adaptations: [...st.adaptations, decision],
      pendingAdaptation: null,
      rest: { ...st.rest, frozen: false },
    }));
    get().track('adaptation_overridden', { kind: decision.kind, compensation: OVERRIDE_COMPENSATION });
    emitCue(cue('override_ack'));
  },

  completeSession: () => {
    const wasResting = get().phase === 'rest';
    set((st) => ({
      phase: 'complete',
      pendingAdaptation: null,
      rest: { ...st.rest, endsAtClock: null, secondsLeft: 0, frozen: false },
    }));
    if (wasResting) restSinks?.onRestExit();
    get().track('session_complete', get().getSummary());
    emitCue(cue('session_done'));
    emitCue(cue('summary_compare'));
    flushTelemetry();
  },

  triggerAbort: () => {
    const s = get();
    if (s.phase === 'aborted') return;
    set((st) => ({
      phase: 'aborted',
      aborted: { reason: ABORT_REASON, hrAtAbort: st.hr.current },
      pendingAdaptation: null,
      rest: { ...st.rest, endsAtClock: null, secondsLeft: 0, frozen: false },
    }));
    restSinks?.onRestExit();
    emitCue(cue('abort'));
    get().track('safety_ceiling_breach', { hr: s.hr.current, ceiling: SAFETY_CEILING_BPM });
    get().track('session_abort');
    flushTelemetry();
  },

  breachCeiling: () => {
    hrSim.forceBreach();
  },

  dropStrap: () => {
    if (!get().hr.connected) return;
    set((st) => ({ hr: { ...st.hr, connected: false } }));
    emitCue(cue('strap_drop'));
    get().track('hr_strap_drop');
  },

  toggleMute: () => {
    const muted = !get().muted;
    set({ muted });
    get().track('mute_change', { muted });
  },

  setSpeed: (s) => {
    set({ speed: s });
    get().track('demo_speed_change', { speed: s });
  },

  setAgentActive: (b) => {
    set({ agentActive: b });
  },

  track: (type, data) => {
    const event = makeEvent(type, get().sessionClock, data);
    set((st) => ({ telemetry: [...st.telemetry, event] }));
    enqueueTelemetry(event);
  },

  resetSession: () => {
    const wasResting = get().phase === 'rest';
    hrSim.reset();
    set(createInitialState());
    if (wasResting) restSinks?.onRestExit();
  },

  demoJump: (target) => {
    const wasResting = get().phase === 'rest';
    set(buildDemoState(target));
    const next = get();

    if (target === 'idle') hrSim.reset();
    else {
      hrSim.prime({
        bpm: next.hr.current,
        phase: next.phase,
        setNumber: next.currentSet,
        ...(next.phase === 'rest' ? { restStartBpm: next.rest.hrAtStart } : {}),
      });
    }

    get().track('demo_state_jump', { target });
    // Whatever moved the machine, the agent must not survive the jump (#33).
    if (wasResting) restSinks?.onRestExit();
    if (next.phase === 'rest') restSinks?.onRestEnter(buildCoachContext(get()));

    if (target === 'summary') return '/summary';
    if (target === 'log') return '/log';
    return '/';
  },

  getSummary: () => {
    const s = get();
    const volumeKg = s.sets.reduce((sum, entry) => sum + entry.repsCompleted * entry.loadKg, 0);
    const avgHr = s.samples.length
      ? Math.round(s.samples.reduce((sum, sample) => sum + sample.bpm, 0) / s.samples.length)
      : 0;
    return {
      volumeKg,
      avgHr,
      durationMs: s.sessionClock,
      setsCompleted: s.sets.filter((entry) => entry.endedAt !== null).length,
      setsPlanned: s.programme.plannedSets,
    };
  },
}));

// ---------------------------------------------------------------------------
// Clock
// ---------------------------------------------------------------------------

let tickHandle: ReturnType<typeof setInterval> | null = null;

/** Idempotent 200 ms real-time ticker; demo speed multiplies session time, not wall time. */
export function startEngineTicker(): void {
  if (tickHandle !== null) return;
  startTelemetryFlusher();
  tickHandle = setInterval(() => {
    const s = useSessionStore.getState();
    if (s.phase !== 'set' && s.phase !== 'rest') return;
    const dt = TICK_MS * s.speed;
    useSessionStore.setState({ sessionClock: s.sessionClock + dt });
    advance(dt);
  }, TICK_MS);
}

export function stopEngineTicker(): void {
  if (tickHandle === null) return;
  clearInterval(tickHandle);
  tickHandle = null;
}

/** One engine step. Exported so it can be driven directly in tests. */
export function advance(dtMs: number): void {
  sampleHeartRate();
  if (checkSafetyCeiling()) return;
  tickRest(dtMs);
}

function sampleHeartRate(): void {
  const s = useSessionStore.getState();
  if (!s.hr.connected) return;

  const nowSec = Math.floor(s.sessionClock / 1000);
  const lastT = s.samples.at(-1)?.t ?? -1000;
  let fromSec = Math.floor(lastT / 1000) + 1;
  if (fromSec > nowSec) return;
  if (nowSec - fromSec > MAX_CATCHUP_SEC) fromSec = nowSec - MAX_CATCHUP_SEC;

  const fresh: HrSample[] = [];
  for (let sec = fromSec; sec <= nowSec; sec++) {
    const clockMs = sec * 1000;
    const restElapsedMs =
      s.phase === 'rest' && s.rest.startedAtClock !== null
        ? Math.max(0, clockMs - s.rest.startedAtClock)
        : 0;
    const bpm = hrSim.sample({
      phase: s.phase,
      setNumber: s.currentSet,
      clockMs,
      restElapsedMs,
    });
    fresh.push({ t: clockMs, bpm });
  }

  const latest = fresh.at(-1);
  if (!latest) return;
  const merged = [...s.samples, ...fresh];
  useSessionStore.setState({
    samples: merged.length > MAX_SAMPLES ? merged.slice(merged.length - MAX_SAMPLES) : merged,
    hr: { ...s.hr, current: latest.bpm, zone: zoneFor(latest.bpm) },
  });
}

/** Absolute ceiling, three samples deep so one artefact cannot stop a session (#23). */
function checkSafetyCeiling(): boolean {
  const s = useSessionStore.getState();
  if (!s.hr.connected || s.samples.length < CEILING_STREAK_TO_ABORT) return false;
  const streak = s.samples.slice(-CEILING_STREAK_TO_ABORT);
  if (streak.length < CEILING_STREAK_TO_ABORT) return false;
  if (!streak.every((sample) => sample.bpm > SAFETY_CEILING_BPM)) return false;
  useSessionStore.getState().triggerAbort();
  return true;
}

function tickRest(dtMs: number): void {
  const s = useSessionStore.getState();
  if (s.phase !== 'rest') return;

  // Frozen: the sheet is open, so the countdown holds by pushing its own deadline.
  if (s.rest.frozen) {
    if (s.rest.endsAtClock !== null) {
      useSessionStore.setState({
        rest: { ...s.rest, endsAtClock: s.rest.endsAtClock + dtMs },
      });
    }
    return;
  }

  const endsAtClock = s.rest.endsAtClock;
  if (endsAtClock === null) return;

  const secondsLeft = Math.max(0, Math.ceil((endsAtClock - s.sessionClock) / 1000));
  if (secondsLeft !== s.rest.secondsLeft) {
    useSessionStore.setState((st) => ({ rest: { ...st.rest, secondsLeft } }));
  }

  // Talking timer (#11).
  if (secondsLeft > 0 && secondsLeft <= REST_WARNING_SEC && !s.rest.warned20) {
    useSessionStore.setState((st) => ({ rest: { ...st.rest, warned20: true } }));
    emitCue(cue('rest_20'));
  }

  const elapsed = s.rest.startedAtClock === null ? 0 : s.sessionClock - s.rest.startedAtClock;
  const lastSet = s.sets.at(-1);
  if (elapsed >= RPE_ASK_AFTER_MS && !s.rest.rpeAsked && lastSet && lastSet.rir === null) {
    useSessionStore.setState((st) => ({ rest: { ...st.rest, rpeAsked: true } }));
    emitCue(cue('rpe_ask'));
  }

  // Recovery delta closes at 60 s — this is where the rules engine gets its say (#21).
  if (elapsed >= RECOVERY_WINDOW_MS) {
    const pending = useSessionStore.getState().recovery.deltas.at(-1);
    if (pending && pending.delta === null) {
      useSessionStore.getState().computeRecoveryForCurrentRest();
    }
  }

  const after = useSessionStore.getState();
  if (after.phase === 'rest' && !after.rest.frozen && after.rest.secondsLeft <= 0) {
    after.exitRest();
  }
}
