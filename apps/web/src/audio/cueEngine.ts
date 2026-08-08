// Tier 0 cue engine — pre-recorded coach voice lines played locally.
// No inference and no network inside a working set (#9): every spoken line is either a
// static /cues/<id>.mp3 or, when that file has not been generated yet, the browser's own
// speech synthesis reading the manifest text. Both paths report cue latency identically.
//
// This module is framework-free on purpose: it is a singleton owned by the session engine,
// not by React, so a re-render can never restart a cue mid-word.

import type { CueEngine, CueRequest } from '../engine/types';
import { getAudioContext, getMasterGain, playGo, playTick } from './earcon';

type CueStartHandler = (id: string, requestedAt: number, startedAt: number) => void;

type QueueItem = {
  cue: CueRequest;
  /** performance.now() at the moment play() was called — the latency clock starts here. */
  requestedAt: number;
};

/** Gap between cues so two lines never sound glued together. */
const GAP_MS = 120;
const DUCKED_VOLUME = 0.25;
const GO_EARCON_ID = 'earcon:go';

const SPEECH_RATE = 1.04;
const SPEECH_PITCH = 0.95;

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

const queue: QueueItem[] = [];
const audioCache = new Map<string, HTMLAudioElement>();
/** Ids whose mp3 has already failed once — go straight to speech, do not re-wait. */
const missingCues = new Set<string>();

let active: QueueItem | null = null;
let ducked = false;

/**
 * Bumped by the presenter rig when the cues are re-rendered in a new voice. The API
 * serves /cues/*.mp3 with a one-hour max-age, so without this suffix the browser would
 * keep playing the old voice and the voice swap would look silently broken.
 * 0 means "never regenerated" — the URL stays clean.
 */
let cueVersion = 0;

/**
 * Bumped on every playback attempt and on every stop. Async callbacks (audio events,
 * utterance events, earcon timers) compare against it and bail if they are stale, which
 * is what makes a 'critical' interrupt safe.
 */
let epoch = 0;

let currentAudio: HTMLAudioElement | null = null;
let detachAudio: (() => void) | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let earconBus: GainNode | null = null;
let advanceTimer: ReturnType<typeof setTimeout> | null = null;
let earconTimer: ReturnType<typeof setTimeout> | null = null;

// ---------------------------------------------------------------------------
// Environment guards — importing this module must be safe outside a browser
// ---------------------------------------------------------------------------

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function getSynth(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null;
  const synth = window.speechSynthesis as SpeechSynthesis | undefined;
  return synth ?? null;
}

function canCreateAudio(): boolean {
  return typeof window !== 'undefined' && typeof window.Audio !== 'undefined';
}

function clearTimer(timer: ReturnType<typeof setTimeout> | null): null {
  if (timer !== null) clearTimeout(timer);
  return null;
}

// ---------------------------------------------------------------------------
// Voice selection (picked once, refreshed when the browser loads its voice list)
// ---------------------------------------------------------------------------

let chosenVoice: SpeechSynthesisVoice | null = null;
let voicesBound = false;

function isEnglish(voice: SpeechSynthesisVoice): boolean {
  return voice.lang.toLowerCase().startsWith('en');
}

function isPreferredLocale(voice: SpeechSynthesisVoice): boolean {
  const lang = voice.lang.toLowerCase().replace('_', '-');
  return lang === 'en-gb' || lang === 'en-us';
}

function selectVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter(isEnglish);
  if (english.length === 0) return null;
  const preferred = english.filter(isPreferredLocale);
  const named = preferred.find((v) => /daniel|samantha/i.test(v.name));
  if (named) return named;
  const namedAnywhere = english.find((v) => /daniel|samantha/i.test(v.name));
  if (namedAnywhere) return namedAnywhere;
  return preferred[0] ?? english[0] ?? null;
}

function bindVoicesChanged(synth: SpeechSynthesis): void {
  if (voicesBound) return;
  voicesBound = true;
  try {
    synth.addEventListener('voiceschanged', () => {
      // The list arrives asynchronously on Chrome; re-pick rather than keep a stale voice.
      chosenVoice = selectVoice(synth.getVoices());
    });
  } catch {
    voicesBound = false;
  }
}

function pickVoice(): SpeechSynthesisVoice | null {
  const synth = getSynth();
  if (synth === null) return null;
  bindVoicesChanged(synth);
  if (chosenVoice !== null) return chosenVoice;
  let voices: SpeechSynthesisVoice[] = [];
  try {
    voices = synth.getVoices();
  } catch {
    return null;
  }
  chosenVoice = selectVoice(voices);
  return chosenVoice;
}

// ---------------------------------------------------------------------------
// Playback primitives
// ---------------------------------------------------------------------------

function cueVolume(): number {
  return ducked ? DUCKED_VOLUME : 1;
}

function emitStart(item: QueueItem, startedAt: number): void {
  const handler = cueEngine.onCueStart;
  if (!handler) return;
  try {
    handler(item.cue.id, item.requestedAt, startedAt);
  } catch {
    // Telemetry must never break playback.
  }
}

function cueUrl(id: string): string {
  const base = `/cues/${encodeURIComponent(id)}.mp3`;
  return cueVersion > 0 ? `${base}?v=${cueVersion}` : base;
}

function getAudioElement(id: string): HTMLAudioElement | null {
  const cached = audioCache.get(id);
  if (cached) return cached;
  if (!canCreateAudio()) return null;
  try {
    const el = new Audio(cueUrl(id));
    el.preload = 'auto';
    el.volume = cueVolume();
    audioCache.set(id, el);
    return el;
  } catch {
    return null;
  }
}

function releaseEarconBus(silence: boolean): void {
  const bus = earconBus;
  earconBus = null;
  if (bus === null) return;
  try {
    if (silence) {
      const ctx = getAudioContext();
      const at = ctx ? ctx.currentTime : 0;
      bus.gain.cancelScheduledValues(at);
      bus.gain.setValueAtTime(0, at);
    }
    bus.disconnect();
  } catch {
    // Graph already torn down.
  }
}

/** Tear down whatever is sounding right now. Does not touch the queue. */
function stopCurrent(): void {
  epoch += 1;
  advanceTimer = clearTimer(advanceTimer);
  earconTimer = clearTimer(earconTimer);

  if (detachAudio) {
    detachAudio();
    detachAudio = null;
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // Element may not be seekable yet.
    }
    currentAudio = null;
  }

  currentUtterance = null;
  const synth = getSynth();
  if (synth) {
    try {
      synth.cancel();
    } catch {
      // Some engines throw when cancelling an empty queue.
    }
  }

  releaseEarconBus(true);
  active = null;
}

/** A cue finished (or was skipped): pause for the gap, then take the next one. */
function finishAndAdvance(token: number): void {
  if (token !== epoch) return;
  if (detachAudio) {
    detachAudio();
    detachAudio = null;
  }
  currentAudio = null;
  currentUtterance = null;
  releaseEarconBus(false);
  active = null;
  advanceTimer = clearTimer(advanceTimer);
  advanceTimer = setTimeout(() => {
    advanceTimer = null;
    drain();
  }, GAP_MS);
}

function drain(): void {
  if (active !== null || advanceTimer !== null) return;
  const item = queue.shift();
  if (!item) return;
  active = item;
  startItem(item);
}

function startItem(item: QueueItem): void {
  const token = ++epoch;
  if (item.cue.kind === 'earcon') {
    startEarcon(item, token);
    return;
  }
  startSpeech(item, token);
}

// --- earcon ---------------------------------------------------------------

function startEarcon(item: QueueItem, token: number): void {
  const ctx = getAudioContext();
  const master = getMasterGain();
  if (ctx === null || master === null) {
    finishAndAdvance(token);
    return;
  }

  let durationMs: number;
  try {
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(master);
    earconBus = bus;
    durationMs = item.cue.id === GO_EARCON_ID ? playGo(bus) : playTick(bus);
  } catch {
    releaseEarconBus(false);
    finishAndAdvance(token);
    return;
  }

  emitStart(item, now());
  earconTimer = setTimeout(() => {
    earconTimer = null;
    finishAndAdvance(token);
  }, durationMs);
}

// --- speech: mp3 first, speech synthesis as the fallback -------------------

function startSpeech(item: QueueItem, token: number): void {
  const id = item.cue.id;
  const el = missingCues.has(id) ? null : getAudioElement(id);
  if (el === null) {
    speakFallback(item, token);
    return;
  }

  let settled = false;
  const onPlaying = (): void => {
    if (token !== epoch) return;
    emitStart(item, now());
  };
  const onEnded = (): void => {
    if (settled) return;
    settled = true;
    finishAndAdvance(token);
  };
  /**
   * @param markMissing true for a load 'error' (the mp3 does not exist yet, so never
   * retry it), false for an autoplay-policy rejection (the file may be fine).
   */
  const failToSpeech = (markMissing: boolean): void => {
    if (settled) return;
    settled = true;
    if (markMissing) {
      // The mp3 has not been generated yet — expected today, so this is a quiet fallback.
      missingCues.add(id);
      audioCache.delete(id);
    }
    if (token !== epoch) return;
    if (detachAudio) {
      detachAudio();
      detachAudio = null;
    }
    currentAudio = null;
    speakFallback(item, token);
  };
  const onError = (): void => {
    failToSpeech(true);
  };

  detachAudio = (): void => {
    el.removeEventListener('playing', onPlaying);
    el.removeEventListener('ended', onEnded);
    el.removeEventListener('error', onError);
  };
  el.addEventListener('playing', onPlaying);
  el.addEventListener('ended', onEnded);
  el.addEventListener('error', onError);

  currentAudio = el;
  try {
    el.volume = cueVolume();
    el.currentTime = 0;
  } catch {
    // currentTime is not settable before metadata on some engines; harmless.
  }

  try {
    const started = el.play() as Promise<void> | undefined;
    if (started && typeof started.catch === 'function') {
      // Autoplay-policy rejection or a missing file: fall through to speech, never
      // leave an unhandled rejection behind.
      started.catch((err: unknown) => {
        const notAllowed = err instanceof DOMException && err.name === 'NotAllowedError';
        failToSpeech(!notAllowed);
      });
    }
  } catch {
    failToSpeech(false);
  }
}

function speakFallback(item: QueueItem, token: number): void {
  if (token !== epoch) return;
  const synth = getSynth();
  const text = item.cue.text.trim();
  if (synth === null || text.length === 0 || typeof SpeechSynthesisUtterance === 'undefined') {
    // No voice available at all: skip this cue rather than stalling the queue.
    finishAndAdvance(token);
    return;
  }

  let settled = false;
  const done = (): void => {
    if (settled) return;
    settled = true;
    finishAndAdvance(token);
  };

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = SPEECH_RATE;
    utterance.pitch = SPEECH_PITCH;
    utterance.volume = cueVolume();
    const voice = pickVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.onstart = (): void => {
      if (token !== epoch) return;
      emitStart(item, now());
    };
    utterance.onend = done;
    utterance.onerror = done;

    currentUtterance = utterance;
    synth.speak(utterance);
  } catch {
    done();
  }
}

// ---------------------------------------------------------------------------
// Public engine
// ---------------------------------------------------------------------------

export const cueEngine: CueEngine & {
  /** Call from the first user gesture (the Start tap) to unlock audio. */
  primeAudio(ids: string[]): Promise<void>;
  isPlaying(): boolean;
  setOnCueStart(fn: CueStartHandler | null): void;
  /** Point playback at a newly rendered set of cue mp3s. 0 = no version suffix. */
  setCueVersion(version: number): void;
} = {
  onCueStart: undefined,

  play(cue: CueRequest): void {
    const item: QueueItem = { cue, requestedAt: now() };

    if (cue.priority === 'critical') {
      // Safety abort only: cut whatever is sounding, drop the queue, speak now.
      stopCurrent();
      queue.length = 0;
      active = item;
      startItem(item);
      return;
    }

    // Dedupe against the queue only — the currently playing cue is allowed to repeat.
    if (queue.some((queued) => queued.cue.id === cue.id)) return;

    if (cue.priority === 'high') {
      // Jumps the queue, but never cuts the current line mid-word.
      queue.unshift(item);
    } else {
      queue.push(item);
    }
    drain();
  },

  stopAll(): void {
    queue.length = 0;
    stopCurrent();
  },

  setDucked(next: boolean): void {
    ducked = next;
    const volume = cueVolume();

    const master = getMasterGain();
    if (master) {
      try {
        const ctx = getAudioContext();
        const at = ctx ? ctx.currentTime : 0;
        master.gain.cancelScheduledValues(at);
        master.gain.setValueAtTime(volume, at);
      } catch {
        master.gain.value = volume;
      }
    }

    if (currentAudio) {
      try {
        currentAudio.volume = volume;
      } catch {
        // Ignore: volume is read-only on some locked-down iOS builds.
      }
    }
    if (currentUtterance) {
      // Affects engines that read volume continuously; new utterances always get it.
      currentUtterance.volume = volume;
    }
  },

  async primeAudio(ids: string[]): Promise<void> {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Gesture was not accepted as an unlock; earcons stay silent, speech still works.
      }
    }
    getMasterGain();

    for (const id of ids) {
      // Missing files are expected before scripts/generate-cues.mjs has run.
      getAudioElement(id);
    }

    const synth = getSynth();
    if (synth) {
      bindVoicesChanged(synth);
      try {
        // First call is what makes Chrome populate the list.
        chosenVoice = selectVoice(synth.getVoices());
      } catch {
        chosenVoice = null;
      }
    }
  },

  isPlaying(): boolean {
    return active !== null || queue.length > 0 || advanceTimer !== null;
  },

  setOnCueStart(fn: CueStartHandler | null): void {
    cueEngine.onCueStart = fn ?? undefined;
  },

  setCueVersion(version: number): void {
    const next = Number.isFinite(version) && version > 0 ? Math.floor(version) : 0;
    if (next === cueVersion) return;
    cueVersion = next;
    // Every cached element holds the previous URL, and every id in missingCues was
    // written off against the previous render. Both have to go or the next play()
    // either reuses the old voice or skips straight to speech synthesis.
    audioCache.clear();
    missingCues.clear();
  },
};
