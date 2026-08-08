# AGENTS.md

Project brain for coding agents working in this repo. Read `mvp-feature-list.md` for the product brief and `TASKS.md` for the task board. Numbered features referenced in code comments (`#25`, `#34`, …) map to the brief.

## What this is

An AI voice workout coach MVP. A React web app rendered inside an iOS device frame, an Express API, ElevenLabs Conversational AI for the rest-window agent and pre-generated ElevenLabs TTS for the in-set cues. Node >= 20, npm workspaces (`apps/*`), ESM throughout.

## Verification

```bash
npm run typecheck    # root: runs tsc in both workspaces
npm run build        # root: vite build + tsc -b (web), tsc (api)
```

Those two are the whole gate.

- **There is no test framework.** No vitest, no jest, no test script anywhere.
- **There is no linter.** No ESLint config.
- **There is no formatter.** No Prettier config. Match the surrounding file.

Do not add any of the three without being asked. `advance(dtMs)` in `engine/sessionStore.ts` is exported specifically so the engine can be driven step by step if a test runner is ever introduced.

## Conventions that matter

**TypeScript is strict, plus `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.** Indexed access returns `T | undefined`; handle it, do not cast it away. Config lives in `tsconfig.base.json`.

**`verbatimModuleSyntax` is on.** Type-only imports must use `import type { Foo } from './foo'` or `import { type Foo }`. A plain value import of a type is a build error.

**The API is ESM with `module: nodenext`.** Every relative import needs the `.js` extension: `import { env } from './env.js'`. The web app uses `moduleResolution: bundler` and does not.

**The web app is plain CSS.** Cadence design tokens as CSS custom properties, imported in `src/styles.css`. Never add Tailwind, CSS-in-JS, or a component library. New styles go in `src/design/components.css` (primitives) or `src/design/screens.css` (screen-specific), using existing tokens.

**Components are presentational only.** Nothing in `src/components/` may import the session store. They take props and render. Screens read the store; components do not. This is currently true — keep it true.

**The engine imports no React.** `src/engine/*` is framework-free: no hooks, no components, no DOM. It reaches the outside world only through the module-level sinks (`setCueSink`, `setRestSinks`), which `main.tsx` and `useCoachAgent.ts` register. Same for `src/audio/cueEngine.ts` — it is a singleton owned by the engine, not by React, so a re-render can never restart a cue mid-word.

**No `Math.random`, no `Date.now()` in decisions, anywhere in the engine.** The HR trace, the recovery deltas and the adaptation must replay identically every run or the demo is a coin flip. `hrSim.ts` uses a deterministic sine wobble. `telemetry.ts` has a counter-based fallback for `crypto.randomUUID`. There are currently zero `Math.random` calls in `apps/` — do not be the one who adds one.

**The rule decides, the model never decides.** `engine/rules.ts` is pure: deltas in, decision out, no store, no clock, no audio, no model. The agent is only ever told what has already been decided. The agent may speak only numbers present in the `CoachContext` object; anything else is an invented number and a demo failure.

## Layering

```
engine (state, rules, HR)  →  cue sink  →  audio (mp3 or speech fallback)
                           →  rest sinks →  voice agent (REST only)
screens read the store · components read props · the rig writes demo state
```

- The engine never calls the audio layer or ElevenLabs directly.
- Every spoken line goes through `emitCue()` in `sessionStore.ts`, which handles mute (`critical` is never suppressed) and fires `cue_played` telemetry even when suppressed.
- **The voice agent is live only in the REST phase.** `useCoachAgent.ts` enforces this three ways: `canTalk` requires `phase === 'rest'`, `startTalk` bails and logs `agent_gate_blocked` otherwise, and a `useEffect` on `phase` ends the session the moment REST is left — demo state jumps included. Never weaken this. The agent must never speak into a working set.
- The `CoachContext` is rebuilt on every REST entry and re-sent when the pending adaptation changes.

## Domain constants

All in `engine/programme.ts` and `engine/rules.ts`. Never hardcode them at a call site.

4 sets × 8 reps at 60 kg · 90 s rest · 20 s spoken warning · 60 s recovery window · `good` ≥ 15 bpm drop, `ok` ≥ 10, `poor` < 10 · 2 consecutive `poor` → cut · first `poor` → silent +20 s · safety ceiling 182 bpm absolute (3 consecutive samples) · override compensation caps the final set at 6 reps.

`unknown` recovery is not `poor`. A dropped strap must never be able to trigger an adaptation.

## Cues

`apps/web/src/audio/cue-manifest.json` is the single source of truth, shared by the app and `scripts/generate-cues.mjs`. Adding a line means: add it to the manifest, re-run `npm run cues:generate`, and reference it via `cue('id')` from `audio/cueScript.ts`. Missing mp3s fall back to browser speech synthesis automatically, so the app never breaks on an ungenerated cue — it just sounds different. The go signal is an earcon (`earcon:go`), synthesized in `audio/earcon.ts`, never speech.

## Design system

`Mobile app health coach trainer/_ds/cadence-design-system-.../` is the **read-only source** — tokens, fonts, the `Live Session.dc.html` reference screen. Do not edit anything in that directory. `apps/web/src/design/` is the ported copy that the app actually uses, and `apps/web/public/{fonts,icons}/` holds the ported assets. Port forward; never point the app at the source directory.

Voice register, from that system: measurement first, one instruction, sentence case, no exclamation marks, no cheerleading. It applies to cue text and to UI copy.

## Running things

```bash
npm run dev:api    # :3000, tsx watch, loads repo-root .env
npm run dev:web    # :5173, proxies /api to :3000
```

**`npm run dev` at the root does not work as expected.** It is `npm run dev --workspaces --if-present`, npm runs workspaces sequentially, and the API's watcher never exits — so the web server never starts. Always use the two scripts above in separate terminals.

The API reads `.env` at boot only. After `npm run agent:create` writes `ELEVENLABS_AGENT_ID`, restart it. If the key is set but no agent id is, the API creates the agent itself on boot (`apps/api/src/voice/bootstrap.ts` spawns `scripts/create-agent.mjs`, the single source of truth for the agent config) — so `ELEVENLABS_API_KEY` alone is a complete configuration.

Without `ELEVENLABS_API_KEY` everything still runs: speech-synthesis cues, `configured: false` from `/api/voice/status`, talk button disabled and labelled "Coach offline".

The demo rig sidebar is hidden below a 1100px viewport. If you are testing the rig, widen the window.

**Single-origin mode.** `apps/api/src/app.ts` serves the built frontend itself when `apps/web/dist/index.html` exists — UI and API on one port, which is what `npm run demo` (`build` then `start`) and the ngrok demo path rely on. No build present means serving is skipped entirely and dev keeps using the Vite dev server and its `/api` proxy. `WEB_DIST` (absolute path) overrides where the build is read from.

**The SPA fallback must never swallow `/api`.** Ordering in `createApp()` is load-bearing: all `/api` routers, then the `/api` catch-all that returns `{"error":"Not found"}` as JSON, and only then the static middleware and the `index.html` fallback for non-`/api` GETs. If you add a route, add it above the `/api` 404, and never move the fallback ahead of it — an API path that returns the HTML shell instead of JSON is a silent client failure.

**`TUNNEL_HOST`** exists for tunnelled dev: `apps/web/vite.config.ts` reads it (hostname only; scheme and trailing slash are stripped), adds it to `server.allowedHosts` and points HMR at `wss://<host>:443`.

## Files that are generated

`apps/web/src/routeTree.gen.ts` — written by the TanStack Router plugin on every dev run and build. It is committed so a fresh clone typechecks. Do not hand-edit it.

## Legacy

`apps/api/src/sessions/*` and `/api/sessions` are leftovers from the original scaffold. Nothing in the coach uses them. Do not build on them; if you need server state, add a new module.
