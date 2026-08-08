// Typed client for /api/voice/* — the coach-voice surface.
//
// Two things carry the coach's voice and they must move together: the ElevenLabs
// conversational agent (rest window) and the 27 pre-rendered Tier 0 mp3s (working set).
// These helpers are deliberately thin — no caching, no retries — because the presenter
// rig is the only caller and it needs the server's real error text on screen.

/** A voice available on the ElevenLabs account. */
export type Voice = {
  id: string;
  name: string;
  category: string;
  /** e.g. "british". Absent for voices with no accent label. */
  accent?: string | null;
  /** Short mp3 sample. Absent for voices with no preview. */
  previewUrl?: string | null;
};

export type VoicesResponse = {
  voices: Voice[];
  /** Voice the conversational agent currently speaks in. */
  agentVoiceId: string | null;
  /** Voice the on-disk Tier 0 cues were rendered in. */
  cueVoiceId: string | null;
  /** Cache-buster for /cues/*.mp3. 0 means "never regenerated". */
  cueVersion: number;
};

export type SetVoiceResponse = {
  ok: true;
  voiceId: string;
  name: string;
};

export type RegenerateResponse = {
  voiceId: string;
  generated: number;
  failed: number;
  version: number;
  count: number;
};

export type CueStatusResponse = {
  voiceId: string | null;
  voiceName?: string | null;
  version: number;
  count: number;
  generatedAt?: string | null;
};

/**
 * Carries the server's own `error` string as the message, so the UI never has to
 * invent a reason. `status` lets callers treat 503 (key/agent not configured) as an
 * expected state rather than a failure.
 */
export class VoiceApiError extends Error {
  readonly status: number;
  readonly hint: string | undefined;

  constructor(message: string, status: number, hint?: string) {
    super(message);
    this.name = 'VoiceApiError';
    this.status = status;
    this.hint = hint;
  }

  /** The API is reachable but has no key/agent configured. Expected, not broken. */
  get notConfigured(): boolean {
    return this.status === 503;
  }
}

type ErrorBody = { error?: unknown; hint?: unknown };

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

async function readBody(res: Response): Promise<unknown> {
  try {
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch (err) {
    // Network/abort. Abort is re-thrown untouched so callers can ignore it on unmount.
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new VoiceApiError('Voice API unreachable', 0);
  }

  const body = await readBody(res);

  if (!res.ok) {
    const parsed: ErrorBody = body !== null && typeof body === 'object' ? (body as ErrorBody) : {};
    const message = asString(parsed.error) ?? `Voice API failed (${res.status})`;
    throw new VoiceApiError(message, res.status, asString(parsed.hint));
  }

  if (body === null || typeof body !== 'object') {
    throw new VoiceApiError('Voice API returned an unexpected response', res.status);
  }

  return body as T;
}

function jsonPost(voiceId: string, signal?: AbortSignal): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voiceId }),
    ...(signal ? { signal } : {}),
  };
}

/** 503 when the key/agent are not configured — check `VoiceApiError.notConfigured`. */
export function listVoices(signal?: AbortSignal): Promise<VoicesResponse> {
  return request<VoicesResponse>('/api/voice/voices', signal ? { signal } : undefined);
}

/** Repoints the conversational agent. 404 when the voice is not on the account. */
export function setAgentVoice(voiceId: string, signal?: AbortSignal): Promise<SetVoiceResponse> {
  return request<SetVoiceResponse>('/api/voice/voice', jsonPost(voiceId, signal));
}

/**
 * Re-renders all Tier 0 cues. 27 sequential TTS calls — expect 20–30 seconds, and
 * expect a 409 if a regeneration is already in flight. Costs real credits.
 */
export function regenerateCues(voiceId: string, signal?: AbortSignal): Promise<RegenerateResponse> {
  return request<RegenerateResponse>('/api/voice/cues/regenerate', jsonPost(voiceId, signal));
}

export function cueStatus(signal?: AbortSignal): Promise<CueStatusResponse> {
  return request<CueStatusResponse>('/api/voice/cues/status', signal ? { signal } : undefined);
}
