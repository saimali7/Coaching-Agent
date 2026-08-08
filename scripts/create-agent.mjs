#!/usr/bin/env node
// Creates the ElevenLabs Conversational AI agent for the voice workout coach
// and writes the resulting agent id into the repo-root .env.
//
// Usage: npm run agent:create   (requires ELEVENLABS_API_KEY in env or .env)

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

const SYSTEM_PROMPT = `You are Cadence, a strength coach speaking in an athlete's ear during the rest window of a live training session.

Style: measurement first, instruction second. Two sentences maximum per reply. No exclamation marks, no cheerleading, no filler. Calm and certain.

Hard rules:
- You may ONLY use numbers present in the session context variables. If a number is not there, say you do not have it. Never invent or estimate a number.
- The training rules engine decides adaptations, not you. You report and explain decisions that already exist in the context; you never invent new loads, sets or reps.
- Adaptation pending and the athlete objects or says they feel fine: concede once, call override_adaptation, and name the compensation: the final set is capped at 6 reps at the same load.
- Adaptation pending and the athlete agrees or accepts: call accept_adaptation.
- The athlete states how many reps they had left in the tank: call log_rir with that number and acknowledge in three words or fewer.
- Asked to extend or skip rest: call extend_rest or skip_rest, confirm in one short sentence.
- Asked "should I go heavier": answer from last_set_rir. 2 or more in reserve: suggest adding 2.5 kilos next session, not today. 1 or fewer: hold the load. If last_set_rir is unknown, ask for it first.
- Asked why a set was cut: give the trigger from pending_adaptation or the context in plain words.
- The rest window has {{rest_seconds_left}} seconds left; keep replies short enough to fit.

Session context: movement {{movement}}, load {{load_kg}} kg, completed set {{completed_set}} of {{planned_sets}}, remaining sets {{remaining_sets}}, target reps {{target_reps}}, last set reps {{last_set_reps}}, last set reps in reserve {{last_set_rir}}, current heart rate {{current_hr}} bpm in zone {{zone}}, recovery states so far {{recovery_states}}, last recovery delta {{last_recovery_delta}} bpm, pending adaptation {{pending_adaptation}}, safety ceiling {{safety_ceiling}} bpm.`;

const body = {
  name: 'Cadence Live Session Coach',
  conversation_config: {
    agent: {
      first_message: '',
      language: 'en',
      prompt: {
        prompt: SYSTEM_PROMPT,
        llm: 'gemini-2.0-flash',
        temperature: 0.3,
        tools: [
          {
            type: 'client',
            name: 'log_rir',
            description:
              'Record how many reps the athlete had left in the tank for the set they just finished. Call whenever the athlete states reps in reserve.',
            parameters: {
              type: 'object',
              properties: { rir: { type: 'number', description: 'Reps in reserve, 0-6' } },
              required: ['rir'],
            },
            expects_response: false,
          },
          {
            type: 'client',
            name: 'extend_rest',
            description: 'Extend the current rest window by a number of seconds.',
            parameters: {
              type: 'object',
              properties: { seconds: { type: 'number', description: 'Seconds to add, 10-120' } },
              required: ['seconds'],
            },
            expects_response: false,
          },
          {
            type: 'client',
            name: 'skip_rest',
            description: 'End the current rest immediately and start the next set.',
            parameters: { type: 'object', properties: {} },
            expects_response: false,
          },
          {
            type: 'client',
            name: 'accept_adaptation',
            description: 'Accept the pending adaptation (the proposed cut).',
            parameters: { type: 'object', properties: {} },
            expects_response: false,
          },
          {
            type: 'client',
            name: 'override_adaptation',
            description:
              'Athlete overrides the proposed cut and will do the final set with the named compensation.',
            parameters: { type: 'object', properties: {} },
            expects_response: false,
          },
          {
            type: 'client',
            name: 'end_session',
            description: 'End the training session now.',
            parameters: { type: 'object', properties: {} },
            expects_response: false,
          },
        ],
      },
      dynamic_variables: {
        dynamic_variable_placeholders: {
          movement: 'Barbell back squat',
          load_kg: '60',
          completed_set: '0',
          planned_sets: '4',
          remaining_sets: '4',
          target_reps: '8',
          last_set_reps: '0',
          last_set_rir: 'unknown',
          current_hr: '0',
          zone: '0',
          recovery_states: 'none',
          last_recovery_delta: 'none',
          pending_adaptation: 'none',
          safety_ceiling: '182',
          rest_seconds_left: '90',
        },
      },
    },
    tts: { voice_id: voiceId, model_id: 'eleven_flash_v2_5' },
    asr: { keywords: ['squat', 'reps', 'rack', 'tank', 'heavier'] },
    conversation: { max_duration_seconds: 600, text_only: false },
  },
};

const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
  method: 'POST',
  headers: { 'xi-api-key': apiKey, 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

if (!response.ok) {
  console.error(`Agent creation failed: HTTP ${response.status}`);
  console.error(await response.text());
  process.exit(1);
}

const data = await response.json();
const agentId = data.agent_id;
console.log(`Agent created: ${agentId}`);

// Update or append ELEVENLABS_AGENT_ID in the repo-root .env (create if missing).
let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
if (/^ELEVENLABS_AGENT_ID=.*$/m.test(envContent)) {
  envContent = envContent.replace(/^ELEVENLABS_AGENT_ID=.*$/m, `ELEVENLABS_AGENT_ID=${agentId}`);
} else {
  if (envContent && !envContent.endsWith('\n')) envContent += '\n';
  envContent += `ELEVENLABS_AGENT_ID=${agentId}\n`;
}
fs.writeFileSync(envPath, envContent);

console.log(`Wrote ELEVENLABS_AGENT_ID to ${envPath}`);
console.log('Restart the API server so it picks up the new agent id.');
