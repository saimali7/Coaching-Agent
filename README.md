# Cadence · AI Coach

A live voice coach for a strength session: the athlete never touches the screen, the plan adapts mid-session off heart-rate recovery, and the coach explains itself in the rest window. Named honestly, this is a React web app presented inside an iOS device frame (402 × 874 on desktop, full-bleed below 1100px) — not a native iOS build. The rest-window conversation runs on ElevenLabs Conversational AI over a WebSocket; the in-set cues are pre-generated ElevenLabs TTS files played from `public/cues`, so nothing inside a working set needs the network or a model.

## The brief

**The problem.** Coaching apps talk at you. They read out numbers, count reps you already counted, and congratulate you for finishing a set you just finished. None of it changes what you do next, so you end up looking at the screen anyway — which is the one thing you cannot do with a loaded bar on your back.

**The thesis.** A coach earns the earpiece by changing the plan. Not by narrating it. So every spoken line in this product has to pass one test: does it change what the athlete does next? If it does not, it does not get said.

**What the MVP proves.** Three things, in order of how hard they are to fake:

1. **A full session runs without touching the screen.** Voice carries the timing — set-up, a go signal, the last three reps counted, a talking rest timer, the call back in. The phone can stay in a pocket.
2. **The plan changes mid-session, driven by real physiology.** Heart-rate recovery — how fast the pulse falls in the first 60 seconds of rest — degrades across the session. Two consecutive poor rests and the session cuts its own remaining work, out loud, with its reason.
3. **The athlete can argue with it.** Hold the mic in a rest window and ask why the set was cut, or say "I feel fine, let me finish." The coach concedes once and names the compensation.

**The one rule that shapes the architecture.** *The rule decides. The model never decides. The agent only reports what has already been decided.* Adaptations come out of a pure function in `engine/rules.ts` — deltas in, decision out, no clock, no model. The language model is handed a context object and forbidden from speaking a number that is not in it. This is why the demo cannot hallucinate a load, and why the session still adapts correctly with the network unplugged and the agent silent.

**Why heart rate, and why the delta.** Absolute heart rate says almost nothing between two people. How fast it *falls* in the first minute of rest is the fatigue signal, and it is the only input honest enough to justify cutting someone's training. For this MVP the trace is a deterministic simulation rather than a chest strap: a demo whose centrepiece depends on the presenter's actual pulse cooperating on stage is a demo that fails on stage. The recovery deltas land on 19 / 8 / 6 bpm every single run, so the cut fires in the third rest, on cue, every time.

**Two tiers of voice, deliberately.** Inside a working set the coach is **Tier 0** — pre-rendered mp3 files, no inference, no network, no chance of a socket drop mistiming a rep count. Only in the rest window does the **conversational agent** get the floor, and it is interrupted the instant rest ends. It is push-to-talk, so it never hears the gym between turns and can never speak over a rep.

**What is deliberately not here.** Automatic rep counting, camera form analysis, sleep and HRV scores, multiple movements, accounts, history. Each one would dilute the single claim this MVP exists to make.

## The other documents

| File | What it is |
|---|---|
| [`TECH-SPEC.md`](./TECH-SPEC.md) | The engineering reasoning in one page — problem, architecture, tool choices, how it was scoped, what v2 looks like |
| [`DEMO.md`](./DEMO.md) | The stage runbook: serving over a tunnel, the four-minute script, the demo rig, what to say out loud |
| [`mvp-feature-list.md`](./mvp-feature-list.md) | The product brief. Numbered features (`#25`, `#34`, …) are referenced from code comments |
| [`AGENTS.md`](./AGENTS.md) | Conventions for coding agents working in this repo |
| [`TASKS.md`](./TASKS.md) | The task board |

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

### Demo over a tunnel

```bash
npm run demo          # build both workspaces, then serve UI + API on PORT (default 3000)
ngrok http 3000       # second terminal; npm run demo:tunnel is the same thing
```

Open the `https://` URL ngrok prints. ngrok is not bundled with this repo — install it and authenticate once with a free account (`ngrok config add-authtoken <token>`).

**Single origin.** When `apps/web/dist/index.html` exists, the API serves the built frontend from `apps/web/dist` (static files with a 1 hour max-age), so one port covers the whole app and one tunnel is enough. Any non-`/api` GET falls back to `index.html` so `/summary` and `/log` survive a refresh or a direct link, while unmatched `/api/*` paths still return `{"error":"Not found"}` as JSON. If the build is absent, serving is skipped entirely and development is unaffected — the Vite dev server and its `/api` proxy work exactly as before. Set `WEB_DIST` to an absolute path to serve the build from somewhere else.

**HTTPS is required for the microphone.** Browsers only expose `getUserMedia` on secure origins, so the rest-window agent will not work over a plain-http LAN address such as `http://192.168.x.x:3000`. The ngrok HTTPS URL is the simplest way to test the voice agent on a phone.

**Tunnelling the dev server instead.** Set `TUNNEL_HOST` to the ngrok hostname (scheme and trailing slash are stripped for you) and Vite adds it to `server.allowedHosts` and points HMR at `wss://<host>:443`:

```bash
TUNNEL_HOST=abc123.ngrok-free.app npm run dev:web
```

Without it Vite rejects the tunnel's forwarded Host header and the HMR socket tries to reach `ws://localhost:5173` from a public origin. This path needs a second tunnel for the API on :3000 (or a proxy in front of both), which is why the built single-origin mode is the recommended one for a demo.

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
│   ├── telemetry.ts      batched, fire-and-forget event queue
│   └── engine.test.ts    node:test suite driving the engine through advance(dtMs)
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

## Talking to the coach

The mic is **push to talk**: hold the round button — or hold the space bar — speak, and release. The WebSocket stays open between turns, so there is no reconnect delay per question and the agent remembers the exchange; only the microphone opens and closes. Between turns it hears nothing, which is what keeps it from talking over a rep or picking up a room.

By default the mic is live **only in the rest window** (#31, #32), and the agent is cut off the instant rest ends (#33) — it must never speak into a working set. The demo rig can lift that gate with **Microphone → Open in every phase** for free-form conversation; the rig labels that state as off-spec, because it is.

Questions it answers from the live session context, and nothing else:

| Ask | What happens |
|---|---|
| "Why did you cut the set?" | The real trigger, in plain words |
| "Should I go heavier?" | Answered from your logged RIR; if none is logged it asks first |
| "I had two left in the tank" | Calls `log_rir`, acknowledges in three words |
| "I feel fine, let me finish" | Concedes, calls `override_adaptation`, names the compensation |
| "Give me another thirty seconds" | Calls `extend_rest`; the timer visibly moves |

The last three fire client tools that change session state, so the UI moves while you talk. If a number is not in the context object, the coach says it does not have it rather than inventing one.

## Changing the coach's voice

The rig has a **Coach voice** picker: every voice on the account, a preview, and a paste-a-voice-id field for voices the list cannot show. Applying a voice does two things in one action — repoints the ElevenLabs agent *and* re-renders all 27 Tier-0 cues — because the coach speaks through both surfaces and changing one without the other makes it sound like two different people. The rig warns when they have drifted apart.

Cue URLs carry a render version (`/cues/set_done.mp3?v=…`), or the browser would keep serving the previous voice from cache and the change would look broken.

From the CLI instead: set `ELEVENLABS_VOICE_ID` and run `npm run cues:generate -- --force`.

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check, returns status and uptime |
| `GET` | `/api/voice/status` | Whether key and agent id are both present, plus the agent id |
| `GET` | `/api/voice/signed-url` | Short-lived ElevenLabs conversation URL. 503 when not configured |
| `GET` | `/api/voice/voices` | Voices on the account, plus the agent's and the cues' current voice |
| `POST` | `/api/voice/voice` | Repoints the agent at a voice id. 404 when it is not on the account |
| `POST` | `/api/voice/cues/regenerate` | Re-renders all 27 cues; writes to `public/cues` and the served build |
| `GET` | `/api/voice/cues/status` | Which voice the cues were rendered in, and the cache-busting version |
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
| `WEB_DIST` | API | Absolute path to the built frontend. Unset means `apps/web/dist`; serving is skipped when no build is there |
| `TUNNEL_HOST` | Vite dev server | Tunnel hostname for dev over ngrok. Adds the host to `allowedHosts` and points HMR at `wss://<host>:443` |

`API_PROXY_TARGET` deliberately has no `VITE_` prefix. Anything prefixed `VITE_` is inlined into the client bundle, so using one variable for both the proxy target and the client base URL would send an internal Docker hostname to the browser.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs both workspaces sequentially — in practice, only the API. Use the two below |
| `npm run dev:api` | API in watch mode on :3000, loading the repo-root `.env` |
| `npm run dev:web` | Vite dev server on :5173 with the `/api` proxy |
| `npm run build` | Builds both apps |
| `npm run typecheck` | Typechecks both apps |
| `npm test` | Runs the engine suite (`tsx --test`) in the web workspace. The API has no tests |
| `npm start` | Runs the compiled API, serving `apps/web/dist` too when it exists |
| `npm run demo` | `build` then `start` — the whole app on one origin, on `PORT` (default 3000) |
| `npm run demo:tunnel` | `ngrok http 3000`. Requires ngrok installed and authenticated |
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
