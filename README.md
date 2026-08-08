# Cadence · Live Session Coach

A live voice coach for a strength session: the athlete never touches the screen, the plan adapts mid-session off heart-rate recovery, and the coach explains itself in the rest window. Named honestly, this is a React web app presented inside an iOS device frame (402 × 874 on desktop, full-bleed below 1100px) — not a native iOS build. The rest-window conversation runs on ElevenLabs Conversational AI over a WebSocket; the in-set cues are pre-generated ElevenLabs TTS files played from `public/cues`, so nothing inside a working set needs the network or a model.

## Quick start

```bash
npm install
```

Then two terminals:

```bash
npm run dev:api    # http://localhost:3000
npm run dev:web    # http://localhost:5173
```

Open http://localhost:5173. The Vite dev server proxies `/api` to `http://localhost:3000`, so there is no CORS in development.

**Gotcha: do not use `npm run dev`.** The root script is `npm run dev --workspaces --if-present`, and npm runs workspaces sequentially. The API's `tsx watch` never exits, so the web workspace is never reached and you get an API with no frontend. Always start the two separately.

A production-like stack is also available:

```bash
docker compose up --build     # or: npm run docker
```

That serves the built frontend from nginx on http://localhost:8080 with `/api` proxied to the API container, so everything is on one origin.

## ElevenLabs setup

The app runs without any of this (see the note at the end), but the rest-window agent and the real coach voice need a key.

1. Copy the example env file:

   ```bash
   cp .env.example .env
   ```

2. Put your key in `.env`:

   ```
   ELEVENLABS_API_KEY=sk_...
   ```

3. Create the Conversational AI agent:

   ```bash
   npm run agent:create
   ```

   This posts the grounded system prompt, the six client tools (`log_rir`, `extend_rest`, `skip_rest`, `accept_adaptation`, `override_adaptation`, `end_session`) and the dynamic-variable placeholders to `POST /v1/convai/agents/create`, prints the new agent id, and writes `ELEVENLABS_AGENT_ID` back into the repo-root `.env`.

4. Restart the API. It reads `.env` at boot (`tsx watch --env-file-if-exists=../../.env`), so a running server will not pick up the new agent id on its own.

5. Pre-render the Tier-0 cues:

   ```bash
   npm run cues:generate
   ```

   This walks every entry in `apps/web/src/audio/cue-manifest.json` (27 lines) and writes `apps/web/public/cues/<id>.mp3` using `ELEVENLABS_VOICE_ID` — the same voice the agent speaks with, so the pre-recorded lines and the live agent do not sound like two different coaches. Existing files are skipped; `npm run cues:generate -- --force` re-renders everything.

**Without a key the app is fully usable.** Tier-0 cues fall back to the browser's own speech synthesis, reading the manifest text (a different voice, and it will sound like one). `GET /api/voice/status` reports `configured: false`, the talk button is disabled and reads "Coach offline", and everything else — the state machine, the HR trace, the recovery deltas, the adaptation, the summary and the log — runs unchanged.

**The API key never reaches the browser.** The client asks the API for a short-lived signed URL (`GET /api/voice/signed-url`), which the server fetches from ElevenLabs with the key in a header, and the WebSocket is opened against that URL.

## Architecture

```
apps/web/src
├── engine/       the session — no React, no randomness
│   ├── types.ts          the domain contract every other module codes against
│   ├── programme.ts      programme, zone model, thresholds, the scripted HR trace
│   ├── sessionStore.ts   Zustand store, state machine, 200 ms ticker, cue emission
│   ├── hrSim.ts          deterministic 1 Hz heart-rate simulator
│   ├── recovery.ts       pure classification of a 60 s recovery delta
│   ├── rules.ts          pure rules engine: deltas in, decision out
│   ├── demoStates.ts     complete, internally consistent snapshots for demo jumps
│   └── telemetry.ts      batched, fire-and-forget event queue
├── audio/        Tier 0 — cue-manifest.json, priority queue, ducking, earcon synth
├── voice/        the ElevenLabs agent: REST-only gate, context object, client tools
├── components/   Cadence primitives (presentational only, no store access)
├── design/       ported Cadence tokens and CSS — plain CSS, no framework
├── screens/      LiveSession, Summary, AdaptationLog
├── demo/         DemoRig — the desktop presenter sidebar, not part of the product
└── routes/       TanStack file routes (/, /summary, /log)

apps/api/src
├── voice/        GET /status and GET /signed-url — the key lives here and nowhere else
├── telemetry/    POST/GET/DELETE event sink, in memory, capped at 5000 events
└── sessions/     legacy CRUD from the original scaffold, unused by the coach
```

**How a session flows.** The Zustand store is the single source of truth and owns every number the UI, the cues and the agent are allowed to show or say. It runs one idempotent 200 ms real-time ticker; the demo speed multiplier multiplies session time, not wall time. Each tick samples the HR simulator at 1 Hz, checks the safety ceiling, and advances the rest countdown. Whenever a line needs speaking the store emits a `CueRequest` into a module-level cue sink; `main.tsx` wires that sink to the audio layer, which plays the mp3 or falls back to speech synthesis and reports cue latency back as telemetry. At the 60 s mark of every rest the store closes the recovery delta and hands it to the pure rules engine, which returns a decision. The rule decides; the agent is only ever told what has already been decided, through a context object rebuilt on every REST entry.

## The rules, in plain numbers

| Rule | Value | Where |
|---|---|---|
| Programme | 1 movement, 4 sets × 8 reps at 60 kg | `PROGRAMME` |
| Rest | 90 s, auto-starts when the set ends | `PROGRAMME.restSeconds` |
| Spoken rest warning | 20 s remaining | `REST_WARNING_SEC` |
| Recovery window | first 60 s of each rest | `RECOVERY_WINDOW_MS` |
| Recovery `good` | HR drop ≥ 15 bpm | `RECOVERY_GOOD_MIN` |
| Recovery `ok` | HR drop 10–14 bpm | `RECOVERY_OK_MIN` |
| Recovery `poor` | HR drop < 10 bpm | — |
| Cut trigger | 2 consecutive `poor` rests → cut the remaining sets | `POOR_STREAK_TO_CUT` |
| First `poor` rest | silent +20 s rest extension, never announced | `SILENT_REST_EXTENSION_SEC` |
| Safety ceiling | 182 bpm absolute, deliberately not zone-derived → abort | `SAFETY_CEILING_BPM` |
| Override compensation | final set capped at 6 reps, same load | `OVERRIDE_REP_CAP` |

Two details the constants do not show. A rest with no measurement (strap dropped, window not closed) classifies as `unknown`, never `poor` — a missing measurement must not be able to trigger an adaptation. And the abort needs three consecutive samples above the ceiling, so one artefact cannot stop a session.

The heart rate is a scripted trace, not a sensor: peaks of 143 / 152 / 158 / 163 bpm per set from an 88 bpm baseline, and 60 s recovery drops of 19 / 8 / 6 / 5 bpm. That is `good → poor → poor`, which is what makes the cut fire in rest 3, every time.

## Screens

| Route | Screen | What it proves |
|---|---|---|
| `/` | Live Session — idle | The plan is stated before anything starts; nothing to read mid-set |
| `/` | Live Session — set | Tap-to-log reps, hero rep count, live HR and zone, the mic is visibly locked |
| `/` | Live Session — rest | Talking countdown, RIR capture, the talk button, recovery delta tiles |
| `/` | Adaptation sheet | The cut, its trigger in real numbers, accept or override — the timer freezes while it is open |
| `/` | Override | Concede plus the named compensation; the final set is capped at 6 reps |
| `/` | Safety abort | Full-screen stop at 182 bpm, with the reading and the ceiling side by side |
| `/summary` | Session summary | Volume, average HR, sets, last recovery, recovery bar chart, instrumentation counts |
| `/log` | Adaptation log | Every decision with its trigger and whether it was taken |
| desktop sidebar | Demo rig | Presenter insurance. Not part of the product; hidden below 1100px |

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check, returns status and uptime |
| `GET` | `/api/voice/status` | Whether key and agent id are both present, plus the agent id |
| `GET` | `/api/voice/signed-url` | Short-lived ElevenLabs conversation URL. 503 when not configured |
| `POST` | `/api/telemetry` | Accepts a batch of up to 500 events, returns 202 |
| `GET` | `/api/telemetry` | Everything captured so far |
| `DELETE` | `/api/telemetry` | Clears the buffer |
| `GET` | `/api/sessions` | Legacy — scaffold CRUD, unused by the coach |
| `GET` | `/api/sessions/:id` | Legacy |
| `POST` | `/api/sessions` | Legacy |
| `DELETE` | `/api/sessions/:id` | Legacy |

Telemetry and the legacy sessions are both stored in memory and reset when the API restarts. The telemetry buffer is capped at 5000 events, oldest dropped first.

## Configuration

Copy `.env.example` to `.env`. Every variable actually read by something:

| Variable | Used by | Purpose |
|---|---|---|
| `PORT` | API | Port the Express server binds to (default 3000) |
| `CORS_ORIGIN` | API | Allowed browser origin (default `http://localhost:5173`) |
| `ELEVENLABS_API_KEY` | API, both scripts | Server-side only. Never sent to the browser |
| `ELEVENLABS_AGENT_ID` | API | Conversational AI agent. Written by `npm run agent:create` |
| `ELEVENLABS_VOICE_ID` | API, both scripts | Voice for the agent and the pre-generated cues (default George, `JBFqnCBsd6RMkjVDRZzb`) |
| `WEB_PORT` | Compose | Host port for the production stack (default 8080) |
| `WEB_DEV_PORT` | Compose | Host port for the web container in the dev stack (default 5173) |
| `API_PORT` | Compose | Host port for the API container in the dev stack (default 3000) |
| `API_PROXY_TARGET` | Vite dev server | Where `/api` is proxied. Server side only |
| `VITE_API_URL` | Client bundle | Absolute API origin. Leave empty to use `/api` |

`API_PROXY_TARGET` deliberately has no `VITE_` prefix. Anything prefixed `VITE_` is inlined into the client bundle, so using one variable for both the proxy target and the client base URL would send an internal Docker hostname to the browser.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs both workspaces sequentially — in practice, only the API. Use the two below |
| `npm run dev:api` | API in watch mode on :3000, loading the repo-root `.env` |
| `npm run dev:web` | Vite dev server on :5173 with the `/api` proxy |
| `npm run build` | Builds both apps |
| `npm run typecheck` | Typechecks both apps |
| `npm start` | Runs the compiled API |
| `npm run agent:create` | Creates the ElevenLabs agent, writes `ELEVENLABS_AGENT_ID` to `.env` |
| `npm run cues:generate` | Renders the cue manifest to `apps/web/public/cues/*.mp3`. `-- --force` re-renders |
| `npm run docker` | Production-like stack, web on :8080 |
| `npm run docker:down` | Stops it |
| `npm run docker:dev` | Hot-reloading stack, web on :5173, API on :3000 |
| `npm run docker:dev:down` | Stops it |

## Known limits

Stated plainly, because none of these are hidden in the demo:

- **Heart rate is simulated.** A deterministic, scripted trace with no RNG anywhere. There is no BLE chest strap and no HealthKit in this MVP; `HrStatus.source` only has one value, `'replay'`. The trace is infrastructure, not a shortcut — an adaptation that fires on the presenter's actual pulse is an adaptation that fails on stage.
- **Rep logging is tap-only.** There is no accelerometer rep counting and no speech-triggered "done" outside the rest window; the mic is hard-gated to REST.
- **Nothing persists.** Session state lives in a Zustand store in the tab, telemetry and legacy sessions live in API memory. Reload and it is gone.
- **One movement, one programme.** Barbell back squat, 4 × 8 at 60 kg, hardcoded.
- **English only**, one voice, one coach persona.
- **No accounts, no sign-in, no history.** The summary's "against last week" line is a fixed cue, not a computed comparison.
- **Web, not native.** No haptics, no background playback with the screen locked, no watch app.
- **Overperformance rule and local intent routing are not implemented** — both were CUT-priority in the brief.

`apps/web/src/routeTree.gen.ts` is generated by the TanStack Router plugin and is committed so typechecking works on a fresh clone. It is regenerated on every dev run and build.
