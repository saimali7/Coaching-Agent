// Shared domain contract for the AI Voice Coach MVP.
// Every module (engine, audio, voice, screens, demo rig) codes against these types.
// The rule decides. The model never decides. The agent only reports what has been decided.

// ---------------------------------------------------------------------------
// Session state machine
// ---------------------------------------------------------------------------

/** IDLE → SET_ACTIVE ⇄ REST → COMPLETE, with ABORTED reachable from any active phase. */
export type SessionPhase = 'idle' | 'set' | 'rest' | 'complete' | 'aborted';

export type Programme = {
  movement: string;
  loadKg: number;
  targetReps: number;
  plannedSets: number;
  restSeconds: number;
};

export type SetLog = {
  setNumber: number; // 1-based
  targetReps: number;
  repsCompleted: number;
  loadKg: number;
  /** Reps in reserve, captured in the rest window ("how many left in the tank?"). */
  rir: number | null;
  startedAt: number; // session clock ms
  endedAt: number | null; // session clock ms
};

// ---------------------------------------------------------------------------
// Heart rate
// ---------------------------------------------------------------------------

export type HrSample = { t: number; bpm: number }; // t = session clock ms

/** Classification of an inter-set recovery delta (HR drop in first 60s of rest). */
export type RecoveryState = 'good' | 'ok' | 'poor' | 'unknown';

export type RecoveryDelta = {
  /** The set this rest followed. */
  setNumber: number;
  hrAtRestStart: number;
  /** null until 60s of rest have elapsed. */
  hrAt60s: number | null;
  /** hrAtRestStart - hrAt60s; null until computed. */
  delta: number | null;
  state: RecoveryState;
};

export type HrStatus = {
  current: number;
  /** Training zone 1–5 derived from max HR. 0 when unknown. */
  zone: number;
  connected: boolean;
  source: 'replay';
};

// ---------------------------------------------------------------------------
// Adaptation (rules engine output)
// ---------------------------------------------------------------------------

export type AdaptationKind = 'cut_sets' | 'extend_rest' | 'abort';

export type AdaptationStatus = 'proposed' | 'accepted' | 'overridden' | 'auto';

export type AdaptationDecision = {
  id: string;
  at: number; // session clock ms
  setNumber: number; // set after which the rule fired
  kind: AdaptationKind;
  /** Human-readable trigger, e.g. "Recovery poor on two consecutive rests (−8, −6)". */
  trigger: string;
  detail: { setsCut?: number; addedRestSec?: number };
  status: AdaptationStatus;
  /** Named compensation when overridden, e.g. "Final set capped at 6 reps". */
  compensation: string | null;
};

// ---------------------------------------------------------------------------
// Audio cues (Tier 0 — pre-recorded, no inference and no network inside a set)
// ---------------------------------------------------------------------------

/**
 * 'critical' interrupts anything playing (safety only).
 * 'high' jumps the queue but does not cut speech mid-word.
 * 'normal' queues.
 */
export type CuePriority = 'critical' | 'high' | 'normal';

export type CueRequest = {
  /** Manifest id (maps to /cues/<id>.mp3) or 'earcon:*' for synthesized signals. */
  id: string;
  /** Spoken text — used by the speech-synthesis fallback when the mp3 is missing. */
  text: string;
  priority: CuePriority;
  kind: 'speech' | 'earcon';
};

export interface CueEngine {
  play(cue: CueRequest): void;
  /** Stop everything immediately (used when the voice agent takes the floor). */
  stopAll(): void;
  /** Duck/unduck cue playback while the conversational agent speaks. */
  setDucked(ducked: boolean): void;
  /** Fired after a cue actually starts playing; used for cue-latency telemetry. */
  onCueStart?: (id: string, requestedAt: number, startedAt: number) => void;
}

// ---------------------------------------------------------------------------
// Telemetry (#44 — metrics with no instrumentation are decoration)
// ---------------------------------------------------------------------------

export type TelemetryType =
  | 'session_start'
  | 'session_complete'
  | 'session_abort'
  | 'set_start'
  | 'set_end'
  | 'rep_logged'
  | 'rest_start'
  | 'rest_end'
  | 'rest_extended'
  | 'rpe_captured'
  | 'cue_played'
  | 'cue_latency'
  | 'mute_change'
  | 'screen_unlock'
  | 'wake_lock_unavailable'
  | 'hr_strap_drop'
  | 'safety_ceiling_breach'
  | 'adaptation_proposed'
  | 'adaptation_accepted'
  | 'adaptation_overridden'
  | 'agent_connect'
  | 'agent_disconnect'
  | 'agent_gate_blocked'
  | 'demo_speed_change'
  | 'demo_state_jump'
  | 'voice_changed'
  | 'cues_regenerated';

export type TelemetryEvent = {
  id: string;
  at: number; // epoch ms
  sessionClock: number; // ms since session start
  type: TelemetryType;
  data?: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Voice agent context (rebuilt on every REST entry — the agent may only use
// numbers present here; anything else is an invented number)
// ---------------------------------------------------------------------------

export type CoachContext = {
  movement: string;
  loadKg: number;
  completedSet: number;
  plannedSets: number;
  remainingSets: number;
  targetReps: number;
  lastSetReps: number;
  lastSetRir: number | null;
  restSecondsLeft: number;
  currentHr: number;
  zone: number;
  recoveryStates: RecoveryState[];
  lastRecoveryDelta: number | null;
  pendingAdaptation: Pick<AdaptationDecision, 'kind' | 'trigger' | 'detail' | 'status'> | null;
  adaptationsSoFar: Pick<AdaptationDecision, 'kind' | 'trigger' | 'status' | 'compensation'>[];
  safetyCeilingBpm: number;
};

// ---------------------------------------------------------------------------
// Demo rig
// ---------------------------------------------------------------------------

export type DemoSpeed = 1 | 4 | 12;

export type DemoJumpTarget =
  | 'idle'
  | 'set'
  | 'rest'
  | 'adapt'
  | 'override'
  | 'abort'
  | 'summary'
  | 'log';
