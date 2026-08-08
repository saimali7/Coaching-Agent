// Tier 0 earcons — WebAudio synthesized signals (no files, no network, no inference).
// The go signal is an earcon, never speech (#9): a spoken "go" is too slow and too
// ambiguous under load, a three-note rising figure is unmistakable.
//
// Everything shares ONE lazily created AudioContext so mobile Safari does not run out
// of contexts, and one master GainNode so the cue engine has a single place to duck.
// Importing this module must never throw in a non-browser context (SSR, tests, workers).

type AudioContextCtor = new () => AudioContext;

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
/** Latched once we know WebAudio is unavailable so we stop retrying on every cue. */
let audioUnavailable = false;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * The shared AudioContext, created on first use.
 * Returns null in non-browser contexts or when WebAudio is unavailable — never throws.
 * Resumes the context when it is 'suspended' (autoplay policy) before anything is scheduled.
 */
export function getAudioContext(): AudioContext | null {
  if (ctx === null) {
    if (audioUnavailable) return null;
    const Ctor = getAudioContextCtor();
    if (Ctor === null) {
      audioUnavailable = true;
      return null;
    }
    try {
      ctx = new Ctor();
    } catch {
      audioUnavailable = true;
      return null;
    }
  }
  if (ctx.state === 'suspended') {
    // Fire and forget: a resume outside a user gesture is allowed to fail.
    void ctx.resume().catch(() => undefined);
  }
  return ctx;
}

/** The shared output gain the cue engine ducks. Null when WebAudio is unavailable. */
export function getMasterGain(): GainNode | null {
  const audioCtx = getAudioContext();
  if (audioCtx === null) return null;
  if (masterGain === null) {
    try {
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 1;
      masterGain.connect(audioCtx.destination);
    } catch {
      masterGain = null;
      return null;
    }
  }
  return masterGain;
}

/** Small scheduling lookahead so the first beep does not glitch on cold contexts. */
const LOOKAHEAD_S = 0.02;

type BeepSpec = {
  freq: number;
  durationMs: number;
  peak: number;
  attackMs: number;
  releaseMs: number;
};

/**
 * Schedules one enveloped sine beep. The envelope (attack ramp in, hold, release ramp out)
 * is what keeps the signal click-free — a raw gated oscillator pops at both ends.
 */
function scheduleBeep(
  audioCtx: AudioContext,
  destination: AudioNode,
  startAt: number,
  spec: BeepSpec,
): void {
  const duration = spec.durationMs / 1000;
  const attack = Math.min(spec.attackMs / 1000, duration * 0.4);
  const release = Math.min(spec.releaseMs / 1000, duration - attack);
  const holdUntil = startAt + duration - release;

  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(spec.freq, startAt);

  const env = audioCtx.createGain();
  env.gain.setValueAtTime(0.0001, startAt);
  env.gain.exponentialRampToValueAtTime(spec.peak, startAt + attack);
  env.gain.setValueAtTime(spec.peak, Math.max(holdUntil, startAt + attack));
  env.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(env);
  env.connect(destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
  osc.onended = (): void => {
    try {
      osc.disconnect();
      env.disconnect();
    } catch {
      // Node already torn down with the graph — nothing to clean up.
    }
  };
}

const GO_BEEPS: readonly { freq: number; durationMs: number }[] = [
  { freq: 880, durationMs: 90 },
  { freq: 1175, durationMs: 90 },
  { freq: 1568, durationMs: 220 },
];
const GO_GAP_MS = 70;
const GO_PEAK = 0.5;
const GO_ATTACK_MS = 8;
const GO_RELEASE_MS = 60;

/**
 * The go signal: three ascending sine beeps (880 → 1175 → 1568 Hz).
 * @param gain destination node (the engine's earcon bus, downstream of the master gain).
 * @returns total duration in ms, used by the queue to know when to advance.
 */
export function playGo(gain: GainNode): number {
  const audioCtx = getAudioContext();
  let totalMs = LOOKAHEAD_S * 1000;
  for (const beep of GO_BEEPS) totalMs += beep.durationMs;
  totalMs += GO_GAP_MS * (GO_BEEPS.length - 1);

  if (audioCtx === null) return totalMs;

  try {
    let at = audioCtx.currentTime + LOOKAHEAD_S;
    for (const beep of GO_BEEPS) {
      scheduleBeep(audioCtx, gain, at, {
        freq: beep.freq,
        durationMs: beep.durationMs,
        peak: GO_PEAK,
        attackMs: GO_ATTACK_MS,
        releaseMs: GO_RELEASE_MS,
      });
      at += (beep.durationMs + GO_GAP_MS) / 1000;
    }
  } catch {
    // Scheduling failed (context closed mid-session): report the duration anyway so
    // the queue still advances instead of stalling.
  }
  return totalMs;
}

const TICK_MS = 60;

/** A single soft blip — used for every non-go earcon id. */
export function playTick(gain: GainNode): number {
  const audioCtx = getAudioContext();
  const totalMs = TICK_MS + LOOKAHEAD_S * 1000;
  if (audioCtx === null) return totalMs;
  try {
    scheduleBeep(audioCtx, gain, audioCtx.currentTime + LOOKAHEAD_S, {
      freq: 1200,
      durationMs: TICK_MS,
      peak: 0.25,
      attackMs: 8,
      releaseMs: 30,
    });
  } catch {
    // Same as playGo: never let a scheduling failure stall the queue.
  }
  return totalMs;
}
