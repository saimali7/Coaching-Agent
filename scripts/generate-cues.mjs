#!/usr/bin/env node
// Pre-generates the Tier-0 audio cues as mp3s via the ElevenLabs TTS API.
// Reads apps/web/src/audio/cue-manifest.json and writes apps/web/public/cues/<id>.mp3.
// Existing files are skipped unless --force is passed.
//
// Usage: npm run cues:generate [-- --force]   (requires ELEVENLABS_API_KEY)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(repoRoot, '.env');

/** Parse KEY=VALUE lines from .env; process.env always takes precedence. */
function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv(envPath);

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error('ELEVENLABS_API_KEY is not set. Add it to the repo-root .env or export it, then re-run.');
  process.exit(1);
}

const voiceId = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
const force = process.argv.includes('--force');

const manifestPath = path.join(repoRoot, 'apps/web/src/audio/cue-manifest.json');
const outDir = path.join(repoRoot, 'apps/web/public/cues');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let generated = 0;
let skipped = 0;
let failed = 0;
const entries = Object.entries(manifest);

for (let i = 0; i < entries.length; i++) {
  const [id, cue] = entries[i];
  const outFile = path.join(outDir, `${id}.mp3`);

  if (!force && fs.existsSync(outFile)) {
    console.log(`- ${id}: exists, skipped (use --force to regenerate)`);
    skipped++;
    continue;
  }

  const startedAt = Date.now();
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'content-type': 'application/json' },
        body: JSON.stringify({
          text: cue.text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15 },
        }),
      },
    );

    if (!response.ok) {
      const bodyText = await response.text();
      console.error(`✗ ${id}: HTTP ${response.status} ${bodyText}`);
      failed++;
    } else {
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(outFile, buffer);
      const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
      const kb = Math.round(buffer.byteLength / 1024);
      console.log(`✓ ${id} (${seconds}s, ${kb} KB)`);
      generated++;
    }
  } catch (err) {
    console.error(`✗ ${id}: ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }

  if (i < entries.length - 1) await delay(350);
}

console.log(`\nDone: ${generated} generated, ${skipped} skipped, ${failed} failed (of ${entries.length} cues).`);
if (failed > 0) process.exit(1);
