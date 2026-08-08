import { Router } from 'express';
import { z } from 'zod';
import { env } from '../env.js';
import {
  CueManifestError,
  CueRenderBusyError,
  isCueRenderRunning,
  readCueMeta,
  renderCues,
} from './cueRenderer.js';

export const voiceRouter: Router = Router();

const ELEVENLABS = 'https://api.elevenlabs.io';

function isConfigured(): boolean {
  return Boolean(env.elevenLabsApiKey && env.elevenLabsAgentId);
}

/** The API key never leaves this module — not in a log line, not in a response. */
function authHeaders(): Record<string, string> {
  return { 'xi-api-key': env.elevenLabsApiKey };
}

interface ElevenLabsVoice {
  voice_id: string;
  name?: string;
  category?: string;
  labels?: Record<string, string> | null;
  preview_url?: string | null;
}

interface AgentConfig {
  conversation_config?: { tts?: { voice_id?: string } };
}

/** The voice currently configured on the ElevenLabs agent, or null if unreadable. */
async function fetchAgentVoiceId(): Promise<string | null> {
  try {
    const response = await fetch(`${ELEVENLABS}/v1/convai/agents/${env.elevenLabsAgentId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      console.error(`[voice] agent read failed: ${response.status} ${await response.text()}`);
      return null;
    }
    const agent = (await response.json()) as AgentConfig;
    return agent.conversation_config?.tts?.voice_id ?? null;
  } catch (err) {
    console.error(`[voice] agent read errored: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

type VoiceLookup =
  | { status: 'ok'; name: string }
  | { status: 'not-found' }
  | { status: 'error' };

/** ElevenLabs signals an unknown voice as 404, or as 400 with this detail code. */
function isVoiceNotFound(status: number, body: string): boolean {
  if (status === 404) return true;
  if (status !== 400) return false;
  return body.includes('voice_not_found');
}

/**
 * Library voices are unknown here until the user adds them to their account,
 * which is the single most confusing failure mode of this feature — so it gets
 * its own status rather than being folded into a generic upstream error.
 */
async function lookupVoice(voiceId: string): Promise<VoiceLookup> {
  try {
    const response = await fetch(`${ELEVENLABS}/v1/voices/${encodeURIComponent(voiceId)}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      const body = await response.text();
      if (isVoiceNotFound(response.status, body)) return { status: 'not-found' };
      console.error(`[voice] voice lookup failed: ${response.status} ${body}`);
      return { status: 'error' };
    }
    const voice = (await response.json()) as ElevenLabsVoice;
    return { status: 'ok', name: voice.name ?? voiceId };
  } catch (err) {
    console.error(`[voice] voice lookup errored: ${err instanceof Error ? err.message : String(err)}`);
    return { status: 'error' };
  }
}

voiceRouter.get('/status', (_req, res) => {
  res.json({ configured: isConfigured(), agentId: env.elevenLabsAgentId || null });
});

voiceRouter.get('/signed-url', async (_req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ error: 'Voice agent not configured' });
  }

  const url = new URL(`${ELEVENLABS}/v1/convai/conversation/get-signed-url`);
  url.searchParams.set('agent_id', env.elevenLabsAgentId);

  const response = await fetch(url, { headers: authHeaders() });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[voice] signed-url request failed: ${response.status} ${body}`);
    return res.status(502).json({ error: 'Failed to get signed URL' });
  }

  const data = (await response.json()) as { signed_url: string };
  res.json({ signedUrl: data.signed_url });
});

/**
 * Everything the voice picker needs in one call: the account's voices, the
 * voice the live agent is using, and the voice the pre-rendered cues were
 * rendered with. Those last two disagreeing is exactly the "coach sounds like
 * two people" state the UI has to surface.
 */
voiceRouter.get('/voices', async (_req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ error: 'Voice agent not configured' });
  }

  const response = await fetch(`${ELEVENLABS}/v2/voices?page_size=100`, { headers: authHeaders() });
  if (!response.ok) {
    const body = await response.text();
    console.error(`[voice] voices list failed: ${response.status} ${body}`);
    return res.status(502).json({ error: 'Failed to list voices' });
  }

  const data = (await response.json()) as { voices?: ElevenLabsVoice[] };
  const voices = (data.voices ?? [])
    .map((voice) => ({
      id: voice.voice_id,
      name: voice.name ?? voice.voice_id,
      category: voice.category ?? '',
      accent: voice.labels?.accent ?? '',
      previewUrl: voice.preview_url ?? '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const agentVoiceId = (await fetchAgentVoiceId()) ?? env.elevenLabsVoiceId;
  const meta = readCueMeta();

  res.json({
    voices,
    agentVoiceId,
    cueVoiceId: meta?.voiceId ?? null,
    cueVersion: meta?.version ?? 0,
  });
});

const setVoiceSchema = z.object({
  voiceId: z.string().min(1).max(64),
});

/**
 * Point the live agent at a different voice. Only `voice_id` is sent: English
 * agents reject the `_v2_5` models, and this agent's tts model is
 * `eleven_flash_v2`, so a full tts object would be refused.
 */
voiceRouter.post('/voice', async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ error: 'Voice agent not configured' });
  }

  const parsed = setVoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid voice payload', issues: z.treeifyError(parsed.error) });
  }
  const { voiceId } = parsed.data;

  const lookup = await lookupVoice(voiceId);
  if (lookup.status === 'not-found') {
    return res.status(404).json({
      error: 'Voice not found on this account',
      hint: 'Add it to your voices in the ElevenLabs dashboard first',
    });
  }
  if (lookup.status === 'error') {
    return res.status(502).json({ error: 'Failed to update the agent voice' });
  }

  const response = await fetch(`${ELEVENLABS}/v1/convai/agents/${env.elevenLabsAgentId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify({ conversation_config: { tts: { voice_id: voiceId } } }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[voice] agent voice patch failed: ${response.status} ${body}`);
    return res.status(502).json({ error: 'Failed to update the agent voice' });
  }

  console.log(`[voice] agent voice set to ${lookup.name} (${voiceId})`);
  res.json({ ok: true, voiceId, name: lookup.name });
});

const regenerateSchema = z.object({
  voiceId: z.string().min(1).max(64).optional(),
});

// Testing aid, kept deliberately: `?limit=2` renders only the first two cues so
// a smoke test costs two TTS calls instead of twenty-seven. Omit it for a real
// regeneration — the default is every cue in the manifest.
const regenerateQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

/**
 * Re-render every cue in the shared manifest with the given voice. Sequential
 * with a 350 ms gap, ~20-30 s for the full set — deliberately no timeout.
 */
voiceRouter.post('/cues/regenerate', async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ error: 'Voice agent not configured' });
  }
  if (isCueRenderRunning()) {
    return res.status(409).json({ error: 'Cue generation already running' });
  }

  const parsed = regenerateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid regenerate payload', issues: z.treeifyError(parsed.error) });
  }
  const parsedQuery = regenerateQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({ error: 'Invalid regenerate query', issues: z.treeifyError(parsedQuery.error) });
  }

  const voiceId = parsed.data.voiceId ?? (await fetchAgentVoiceId()) ?? env.elevenLabsVoiceId;

  const lookup = await lookupVoice(voiceId);
  if (lookup.status === 'not-found') {
    return res.status(404).json({
      error: 'Voice not found on this account',
      hint: 'Add it to your voices in the ElevenLabs dashboard first',
    });
  }
  const voiceName = lookup.status === 'ok' ? lookup.name : voiceId;

  try {
    const result = await renderCues({
      apiKey: env.elevenLabsApiKey,
      voiceId,
      voiceName,
      ...(parsedQuery.data.limit === undefined ? {} : { limit: parsedQuery.data.limit }),
    });

    const body = {
      voiceId: result.voiceId,
      generated: result.generated,
      failed: result.failed,
      version: result.version,
      count: result.count,
    };

    // Nothing rendered at all is an upstream failure, not a partial result.
    if (result.generated === 0 && result.failed > 0) {
      return res.status(502).json({ error: 'Failed to generate cues', ...body, issues: result.errors });
    }
    res.json(body);
  } catch (err) {
    if (err instanceof CueRenderBusyError) {
      return res.status(409).json({ error: 'Cue generation already running' });
    }
    if (err instanceof CueManifestError) {
      console.error(`[voice] ${err.message}`);
      return res.status(500).json({ error: 'Cue manifest could not be read', detail: err.message });
    }
    throw err;
  }
});

voiceRouter.get('/cues/status', (_req, res) => {
  const meta = readCueMeta();
  if (!meta) {
    return res.json({ voiceId: null, version: 0, count: 0 });
  }
  res.json(meta);
});
