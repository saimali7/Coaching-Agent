// Re-renders the Tier-0 mp3 cues at runtime so the presenter can switch the
// coach's voice from the demo rig without restarting anything.
//
// This is the server-side twin of scripts/generate-cues.mjs: same endpoint,
// same model, same voice settings, so a cue rendered here is indistinguishable
// from one rendered by `npm run cues:generate`. The difference is where the
// bytes land — see resolveCueTargets() below.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../env.js';

const TTS_MODEL_ID = 'eleven_turbo_v2_5';
const TTS_VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, style: 0.15 } as const;
/** Rate-limit friendly gap between sequential TTS calls, as in the script. */
const REQUEST_GAP_MS = 350;

export interface CueManifestEntry {
  text: string;
  priority: string;
}

export interface CueMeta {
  voiceId: string;
  voiceName: string;
  version: number;
  count: number;
  generatedAt: string;
}

export interface CueRenderResult {
  voiceId: string;
  voiceName: string;
  generated: number;
  failed: number;
  version: number;
  count: number;
  errors: string[];
  /** Absolute dirs the mp3s were written to (public always, dist when serving a build). */
  targets: string[];
}

/** Thrown when the shared cue manifest cannot be located or parsed. */
export class CueManifestError extends Error {}
/** Thrown when a second regeneration is requested while one is in flight. */
export class CueRenderBusyError extends Error {}

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Locate apps/web/src/audio/cue-manifest.json.
 *
 * The API runs from apps/api both in dev (`tsx watch src/index.ts`) and in prod
 * (`node dist/index.js`), so `../web/src/audio/...` off cwd is the right base.
 * The repo root and a module-relative walk are kept as fallbacks so an unusual
 * cwd degrades into a clear error rather than a wrong-but-plausible path.
 */
function resolveManifestPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(process.cwd(), '../web/src/audio/cue-manifest.json'),
    join(process.cwd(), 'apps/web/src/audio/cue-manifest.json'),
    // src/voice -> src -> apps/api -> apps -> web (dev), and one level deeper from dist.
    resolve(here, '../../../web/src/audio/cue-manifest.json'),
    resolve(here, '../../../../web/src/audio/cue-manifest.json'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new CueManifestError(
    `Cue manifest not found. Looked in: ${candidates.join(', ')} (cwd: ${process.cwd()})`,
  );
}

/** Read + parse the manifest at call time — no JSON import assertion needed. */
export function readCueManifest(): Array<[string, CueManifestEntry]> {
  const manifestPath = resolveManifestPath();
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    throw new CueManifestError(
      `Cue manifest at ${manifestPath} is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new CueManifestError(`Cue manifest at ${manifestPath} must be an object of id -> { text, priority }`);
  }

  const entries: Array<[string, CueManifestEntry]> = [];
  for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const text = (value as { text?: unknown }).text;
    const priority = (value as { priority?: unknown }).priority;
    if (typeof text !== 'string' || text.length === 0) continue;
    entries.push([id, { text, priority: typeof priority === 'string' ? priority : 'normal' }]);
  }
  if (entries.length === 0) {
    throw new CueManifestError(`Cue manifest at ${manifestPath} contains no usable cues`);
  }
  return entries;
}

/**
 * Every directory an mp3 must land in.
 *
 * a) apps/web/public/cues — the source of truth, picked up by the next build.
 * b) <webDist>/cues       — what app.ts actually serves in single-origin mode.
 *
 * (b) is the load-bearing half: without it the running demo keeps serving the
 * OLD audio out of the existing build and the voice switch silently does
 * nothing. The dist dir is resolved exactly as app.ts resolves it, and is only
 * written to when it already exists (i.e. a build is present and being served).
 */
export function resolveCueTargets(): { publicDir: string; distDir: string | null } {
  const manifestPath = resolveManifestPath();
  // <web>/src/audio/cue-manifest.json -> <web>
  const webRoot = resolve(dirname(manifestPath), '../..');
  const publicDir = join(webRoot, 'public/cues');

  const webDist = env.webDist ?? join(process.cwd(), '../web/dist');
  const distDir = existsSync(webDist) ? join(webDist, 'cues') : null;

  return { publicDir, distDir };
}

function writeToTargets(targets: string[], fileName: string, data: Buffer | string): void {
  for (const dir of targets) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, fileName), data);
  }
}

export function readCueMeta(): CueMeta | null {
  const { publicDir } = resolveCueTargets();
  const metaPath = join(publicDir, '.meta.json');
  if (!existsSync(metaPath)) return null;
  try {
    return JSON.parse(readFileSync(metaPath, 'utf8')) as CueMeta;
  } catch (err) {
    console.error(`[voice] cue metadata at ${metaPath} is unreadable: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

let running = false;
export function isCueRenderRunning(): boolean {
  return running;
}

export interface RenderCuesOptions {
  apiKey: string;
  voiceId: string;
  voiceName: string;
  /** Testing aid: render only the first N cues so a smoke test costs 2 calls, not 27. */
  limit?: number;
}

/**
 * Render every cue sequentially and write each file the moment it arrives, so
 * nothing larger than one mp3 is ever held in memory and the presenter can
 * watch progress line by line in the server terminal. Individual failures are
 * collected and reported, never thrown.
 */
export async function renderCues(options: RenderCuesOptions): Promise<CueRenderResult> {
  if (running) throw new CueRenderBusyError('Cue generation already running');
  running = true;

  const { apiKey, voiceId, voiceName, limit } = options;

  try {
    const all = readCueManifest();
    const entries = typeof limit === 'number' ? all.slice(0, limit) : all;
    const { publicDir, distDir } = resolveCueTargets();
    const targets = distDir ? [publicDir, distDir] : [publicDir];

    console.log(
      `[voice] regenerating ${entries.length} cue(s) as ${voiceName} (${voiceId}) -> ${targets.join(', ')}`,
    );
    if (!distDir) {
      console.log('[voice] no web build present, writing public/cues only');
    }

    let generated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry) continue;
      const [id, cue] = entry;
      const startedAt = Date.now();

      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
          {
            method: 'POST',
            headers: { 'xi-api-key': apiKey, 'content-type': 'application/json' },
            body: JSON.stringify({
              text: cue.text,
              model_id: TTS_MODEL_ID,
              voice_settings: TTS_VOICE_SETTINGS,
            }),
          },
        );

        if (!response.ok) {
          const bodyText = await response.text();
          console.error(`[voice] ✗ ${id}: HTTP ${response.status} ${bodyText}`);
          errors.push(`${id}: HTTP ${response.status}`);
          failed++;
        } else {
          const buffer = Buffer.from(await response.arrayBuffer());
          writeToTargets(targets, `${id}.mp3`, buffer);
          const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
          const kb = Math.round(buffer.byteLength / 1024);
          console.log(`[voice] ✓ ${id} (${seconds}s, ${kb} KB)`);
          generated++;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[voice] ✗ ${id}: ${message}`);
        errors.push(`${id}: ${message}`);
        failed++;
      }

      if (i < entries.length - 1) await delay(REQUEST_GAP_MS);
    }

    // Date.now() as the version: the client appends it as a cache-buster so the
    // browser cannot keep serving the previous voice out of its HTTP cache.
    const version = Date.now();
    const meta: CueMeta = {
      voiceId,
      voiceName,
      version,
      count: entries.length,
      generatedAt: new Date(version).toISOString(),
    };
    if (generated > 0) {
      writeToTargets(targets, '.meta.json', `${JSON.stringify(meta, null, 2)}\n`);
    }

    console.log(`[voice] done: ${generated} generated, ${failed} failed (of ${entries.length} cues), version ${version}`);

    return { voiceId, voiceName, generated, failed, version, count: entries.length, errors, targets };
  } finally {
    running = false;
  }
}
