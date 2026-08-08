import type { CuePriority, CueRequest } from '../engine/types';
import manifest from './cue-manifest.json';

// Tier 0 cue manifest. Every spoken line in a session is fixed text so it can be
// pre-generated with ElevenLabs TTS (scripts/generate-cues.mjs → public/cues/<id>.mp3)
// and played with zero inference and zero network inside a working set.
// cue-manifest.json is the single source of truth, shared with the generator script.
// Voice register (Cadence): measurement first, one instruction, no exclamation marks.

export type CueId = keyof typeof manifest;

const defs = manifest as Record<string, { text: string; priority: string }>;

/** Speech cue from the manifest. */
export function cue(id: CueId): CueRequest {
  const def = defs[id];
  if (!def) throw new Error(`Unknown cue: ${String(id)}`);
  return { id, text: def.text, priority: def.priority as CuePriority, kind: 'speech' };
}

/** Count cue for a given rep number (1–10), spoken for the last three reps of a set. */
export function countCue(n: number): CueRequest | null {
  const id = `count_${n}`;
  return id in defs ? cue(id as CueId) : null;
}

/** The go signal is an earcon, never speech (#9). */
export const GO_EARCON: CueRequest = {
  id: 'earcon:go',
  text: '',
  priority: 'high',
  kind: 'earcon',
};

export const CUE_IDS = Object.keys(defs) as CueId[];
