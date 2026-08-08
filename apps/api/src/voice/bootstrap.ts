import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { env } from '../env.js';

// One-command start for judges: with an API key but no agent id, create the
// agent automatically on boot. scripts/create-agent.mjs is the single source
// of truth for the agent config (prompt, tools, turn settings) — running it,
// rather than duplicating the config here, keeps the two paths identical.
// Missing script (e.g. inside a container) or a failed create degrades to the
// normal unconfigured state: cues still play, the talk button says offline.
export function ensureVoiceAgent(): void {
  if (!env.elevenLabsApiKey || env.elevenLabsAgentId) return;

  const script = resolve(process.cwd(), '../../scripts/create-agent.mjs');
  if (!existsSync(script)) {
    console.log('[voice] no agent id and no create script — voice agent stays offline');
    return;
  }

  console.log('[voice] ELEVENLABS_API_KEY is set but no agent exists — creating one…');
  const run = spawnSync(process.execPath, [script], {
    cwd: resolve(process.cwd(), '../..'),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 30_000,
  });

  const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  const match = out.match(/Agent created: (agent_\w+)/);
  if (run.status === 0 && match?.[1]) {
    env.elevenLabsAgentId = match[1];
    console.log(`[voice] agent ready: ${match[1]}`);
    return;
  }

  // The script may have written the id to .env even if parsing failed.
  const envFile = resolve(process.cwd(), '../../.env');
  if (existsSync(envFile)) {
    const fromFile = readFileSync(envFile, 'utf8').match(/^ELEVENLABS_AGENT_ID=(agent_\w+)$/m);
    if (fromFile?.[1]) {
      env.elevenLabsAgentId = fromFile[1];
      console.log(`[voice] agent ready: ${fromFile[1]}`);
      return;
    }
  }

  console.error('[voice] agent creation failed — voice agent stays offline');
  console.error(out.trim().split('\n').slice(-3).join('\n'));
}
