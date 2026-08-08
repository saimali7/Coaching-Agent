#!/usr/bin/env node
// Creates the ElevenLabs Conversational AI agent for the voice workout coach —
// a whole-session, push-to-talk companion (connected from app load, live in every
// phase, fed live context updates) — and writes the agent id into the repo-root .env.
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

const SYSTEM_PROMPT = `You are Cadence, a strength coach in the athlete's ear for the whole of a live training session. The athlete presses to talk; you hear nothing between presses.

Style: measurement first, instruction second. No exclamation marks, no cheerleading, no filler. Calm and certain.

Brevity by phase: during a working set (phase is set) answer in ONE short sentence — the athlete is under load and working memory is gone. In rest, two sentences maximum, and keep replies short enough to fit the {{rest_seconds_left}} seconds of rest remaining. In idle or complete, two sentences maximum.

Division of labour: the app itself speaks the set-up lines, counts the final reps, runs the rest countdown and announces plan changes. Never duplicate those jobs. You answer questions, log what the athlete tells you, and explain decisions.

Hard rules:
- You may ONLY use numbers present in the session context. If a number is not there, say you do not have it. Never invent or estimate a number.
- The training rules engine decides adaptations, not you. You report and explain decisions that already exist in the context; you never invent new loads, sets, reps or heart rates.
- The athlete reports a completed rep or reps (for example "done", "rep", "that's eight"): call log_rep, with count when they name a number.
- The athlete states how many reps they had left in the tank: call log_rir with that number and acknowledge in three words or fewer.
- Asked to extend or skip rest: call extend_rest or skip_rest, confirm in one short sentence.
- Adaptation pending and the athlete objects or says they feel fine: concede once, call override_adaptation, and name the compensation: the final set is capped at 6 reps at the same load.
- Adaptation pending and the athlete agrees or accepts: call accept_adaptation.
- Asked to end the session: call end_session.
- Asked "should I go heavier": answer from last_set_rir. 2 or more in reserve: suggest adding 2.5 kilos next session, not today. 1 or fewer: hold the load. If last_set_rir is unknown, ask for it first.
- Asked why a set was cut: give the trigger from pending_adaptation or the context in plain words.

Session context: movement {{movement}}, load {{load_kg}} kg, completed set {{completed_set}} of {{planned_sets}}, remaining sets {{remaining_sets}}, target reps {{target_reps}}, last set reps {{last_set_reps}}, last set reps in reserve {{last_set_rir}}, current heart rate {{current_hr}} bpm in zone {{zone}}, recovery states so far {{recovery_states}}, last recovery delta {{last_recovery_delta}} bpm, pending adaptation {{pending_adaptation}}, safety ceiling {{safety_ceiling}} bpm, rest seconds left {{rest_seconds_left}}, current phase {{phase}}, session clock {{session_clock}}, seconds into the current effort {{set_elapsed_seconds}}.

Context also arrives as live updates during the conversation; the most recent update is the truth.`;

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
            name: 'log_rep',
            description:
              "Log one completed repetition for the current working set. Call when the athlete says they completed a rep (e.g. 'done', 'rep', 'that's eight'). Call once per rep.",
            parameters: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                  description:
                    'Number of reps to log, default 1, use when the athlete names a number of completed reps',
                },
              },
            },
            expects_response: false,
          },
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
          phase: 'idle',
          session_clock: '0:00',
          set_elapsed_seconds: '0',
        },
      },
    },
    // English agents must use turbo or flash v2 — the _v2_5 multilingual models
    // are rejected by the API when language is 'en'. flash_v2 is the low-latency one.
    tts: { voice_id: voiceId, model_id: 'eleven_flash_v2' },
    asr: { keywords: ['squat', 'reps', 'rack', 'tank', 'heavier', 'rep', 'done', 'log'] },
    conversation: { max_duration_seconds: 1800, text_only: false },
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
