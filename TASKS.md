# AI Voice Coach — MVP Task Board

**Cycle:** Demo MVP · **Target:** live session runs hands-free, adapts off real physiology, athlete talks to the coach in rest windows.
Status: `Done` (implemented and wired end to end) · `Partial` (built, with the gap named in Notes) · `Not done` (cut, or not possible on this target) · Priority: `P0 Urgent` (MUST) · `P1 High` (SHOULD) · `P2 Low` (CUT candidates)

## Screen & flow map

```
┌─────────┐  Start training  ┌───────────────┐  target reps logged / endSet
│ S1 IDLE │─────────────────▶│ S2 SET_ACTIVE │──────────────┬─────────────────┐
│ "Ready" │                  │ tap-to-log    │              │                 │
└─────────┘                  │ hero rep count│      sets remaining     last planned set
                             └───────▲───────┘              │                 │
     rest hits zero, or "Skip rest"  │                      ▼                 │
     — the next set is capped at 6   │            ┌────────────────────┐      │
     reps after an override          └────────────│      S3 REST       │      │
                                                  │ 90 s countdown     │      │
                                                  │ mic live · RIR tap │      │
                                                  │ 20 s warning       │      │
                                                  └─────────┬──────────┘      │
                    60 s recovery window closes             │                 │
                    → rules.evaluate()                      │                 │
                      1st poor → silent +20 s, unannounced  │                 │
                      2nd poor → propose the cut ───────────┤                 │
                                                            ▼                 │
                                                  ┌────────────────────┐      │
                                                  │ S4 ADAPTATION SHEET│      │
                                                  │ trigger + facts    │      │
                                                  │ freezes the rest   │      │
                                                  │ countdown · own    │      │
                                                  │ "Talk it through"  │      │
                                                  └──┬──────────────┬──┘      │
                         "Take the cut" — session    │              │ "I feel fine,
                         completes immediately       │              │  let me finish"
                                                     │              ▼         │
                                                     │   S5 OVERRIDE, resolved in place:
                                                     │   sheet closes, countdown resumes,
                                                     │   final set capped at 6 → back to S3
                                                     ▼                        ▼
 ┌────────────────────────────────────┐      ┌──────────────┐ Open the log ┌──────────────┐
 │ S6 SAFETY ABORT · full screen on / │─────▶│ S7 SUMMARY   │─────────────▶│ S8 ADAPT LOG │
 │ HR > 182 on 3 samples, in SET/REST │ End  │ /summary     │◀──── Back ───│ /log         │
 │ nothing is adapted, the run ends   │ sess.└──────────────┘              └──────────────┘
 └────────────────────────────────────┘

COMPLETE navigates itself to /summary after 1.4 s.
S9 DEMO RIG (desktop sidebar, hidden below 1100px): 1×/4×/12× clock · jump to
idle · set · rest · adapt · override · abort · summary · log · breach the ceiling · drop the strap
```

| Screen | Route | Design source |
|---|---|---|
| S1–S4 Live Session (idle/set/rest + adapt sheet) | `/` | `Live Session.dc.html` main screen |
| S5 Override | `/` — resolved inside the sheet, not a screen of its own | override section |
| S6 Safety abort | `/` full-screen replacement | abort section |
| S7 Session summary | `/summary` | summary section |
| S8 Adaptation log | `/log` | log section |
| S9 Demo rig | desktop sidebar | demo rig section |

## Status at a glance

**31 Done · 1 Partial · 0 Not done** across CO-1 – CO-32. The remaining Partial is CO-32: typecheck, build and 45 engine tests are green, but the demo has not been rehearsed and the voice agent has never run against a live ElevenLabs agent.

Against the brief's "What the MVP proves": two of the three claims stand up in code today — the session runs itself from the first tap to the summary with voice carrying every transition, and the plan cuts itself mid-session off the 60 s recovery delta with the trigger spoken in one sentence. The third, talking to the coach in the rest window, is wired end to end and hard-gated to REST but is unproven until someone adds an `ELEVENLABS_API_KEY`, creates the agent and rehearses it; the physiology behind the adaptation is a deterministic replay, not a strap, which is a stated scoping decision rather than a gap.

## Epic 1 · Foundation

| ID | Task | Priority | Est | Deps | Status | Notes |
|---|---|---|---|---|---|---|
| CO-1 | Port Cadence tokens, fonts, icons into `apps/web` | P0 | S | — | Done | |
| CO-2 | Domain contract `engine/types.ts` + programme constants | P0 | S | — | Done | |
| CO-3 | Cadence primitives: Button, Badge, Card, MetricTile, BarSeries, Sheet, Orb, SetPips, StatRow, InsightCallout, Icon | P0 | M | CO-1 | Done | Ships 15 primitives behind one barrel: the 11 named plus DeltaTile, CaptionCard, IOSFrame, PhoneStage. None of them import the store. |
| CO-4 | iOS device frame port (402×874 shell, status bar) | P0 | S | CO-1 | Done | |

## Epic 2 · Session core (Block 1)

| ID | Task | Priority | Est | Deps | Status | Notes |
|---|---|---|---|---|---|---|
| CO-5 | Zustand session store: state machine `IDLE → SET ⇄ REST → COMPLETE` + ABORTED, tick loop with speed multiplier | P0 | M | CO-2 | Done | 200 ms real-time ticker; the demo speed multiplies session time, not wall time. One extra edge over the original drawing: accepting a cut goes REST → COMPLETE directly. |
| CO-6 | Tap-to-log reps · auto rest start on set end · 90 s rest countdown | P0 | S | CO-5 | Done | Screen copy invites "or just say done". There is no in-set speech recognition — the mic is hard-gated out of SET — so only the tap logs a rep. Either build it or change the line. |
| CO-7 | Live Session screen states: idle / set / rest, per design | P0 | L | CO-3, CO-6 | Done | Also renders complete and the full-screen abort. |

## Epic 3 · Tier-0 voice cues (Block 2)

| ID | Task | Priority | Est | Deps | Status | Notes |
|---|---|---|---|---|---|---|
| CO-8 | Cue engine: priority queue, ducking, interrupt for `critical` | P0 | M | CO-2 | Done | `stopAll()` is implemented but nothing calls it: when the agent takes the floor the engine ducks Tier-0 to 25% rather than cutting it. There is no music player to duck — ducking applies to the cue bus itself. |
| CO-9 | Cue manifest (fixed scripts) + earcon synth (go signal — never speech) | P0 | S | CO-8 | Done | 27 lines in `cue-manifest.json`; the go signal is three ascending sines in `earcon.ts`. |
| CO-10 | `generate-cues` script — ElevenLabs TTS → `public/cues/*.mp3` (same voice as agent) + browser-speech fallback | P0 | M | CO-9 | Done | Both code paths are written and the fallback is exercised on every run today: `apps/web/public/cues/` does not exist, so every line is browser speech synthesis until someone runs the script with a key. |
| CO-11 | Wire cues: set-up, go earcon, last-3 rep count, rest 20 s warning, call-in at zero, transition | P0 | S | CO-6, CO-9 | Done | All six fire. Block 2's "phone in a pocket" outcome is still out of reach on this target: brief #13 (haptics) and #14 (screen-locked background playback) are not implementable in a browser tab. |

## Epic 4 · Heart rate (Block 3 — replay/dummy per decision)

| ID | Task | Priority | Est | Deps | Status | Notes |
|---|---|---|---|---|---|---|
| CO-12 | Deterministic phase-driven HR simulator (1 Hz, scripted peaks/drops, no RNG) | P0 | M | CO-5 | Done | Replay only, and that is the scope: brief #15 (BLE strap / Apple Watch via HealthKit) was cut in favour of #17 per the brief's own cut order — dummy data for the MVP. No `Math.random` anywhere; the same taps produce the same trace and the same deltas. |
| CO-13 | Recovery delta: HR drop in first 60 s of each rest → `good/ok/poor` rolling state | P0 | M | CO-12 | Done | |
| CO-14 | HR + zone in header (glanceable, never required) + recovery delta tiles | P0 | S | CO-7, CO-13 | Done | |
| CO-15 | Strap-drop handling: announce once, continue without adaptation | P0 | S | CO-12 | Done | Only the demo rig can drop the strap and there is no reconnect — there is no real device to lose. An unmeasured rest classifies as `unknown`, never `poor`, so a dead strap can never trigger an adaptation. |
| CO-16 | Safety ceiling: HR > 182 → abort protocol + full-screen abort | P0 | M | CO-12 | Done | Three consecutive samples above the ceiling are required, deliberately, so one artefact cannot end a session. The ceiling is absolute, not zone-derived. |

## Epic 5 · Adaptation (Block 4 — the moat)

| ID | Task | Priority | Est | Deps | Status | Notes |
|---|---|---|---|---|---|---|
| CO-17 | RPE capture in rest window ("how many left in the tank?") — spoken via agent tool + tap fallback | P0 | S | CO-7 | Done | Asked by cue 8 s into every rest. The tap fallback offers RIR 0–3; the `log_rir` tool accepts any number. |
| CO-18 | Rules engine: 2 consecutive `poor` rests → cut remaining sets; adaptation log entries | P0 | M | CO-13 | Done | `rules.ts` is pure — deltas in, decision out, no store, no clock, no model. |
| CO-19 | Silent rest extension on first `poor` (the only unannounced adaptation) | P1 | S | CO-18 | Done | Silent means unannounced, not unrecorded: it is written to the adaptation log and visible on `/log`. |
| CO-20 | Adaptation sheet: trigger facts, Accept cut / Override | P0 | M | CO-18 | Done | Two deviations from the original text, both deliberate: the sheet freezes the rest countdown while it is unresolved, and it carries its own "Talk it through" mic button because it covers the screen. Accepting the cut ends the session immediately (`acceptAdaptation` → `completeSession`), it does not return to the rest window. |
| CO-21 | Override flow: concede + named compensation (final set capped) spoken in rest | P0 | S | CO-20 | Done | The cap is real, not a phrase: `startSet` targets 6 reps on the final set once an override exists, and `setup_set_4_capped` is a separate cue so the coach does not announce eight reps after conceding a six-rep cap. |

## Epic 6 · Voice agent (Block 5)

| ID | Task | Priority | Est | Deps | Status | Notes |
|---|---|---|---|---|---|---|
| CO-22 | API: `GET /api/voice/signed-url` (+ config endpoint), key server-side only | P0 | S | — | Done | `GET /api/voice/status` is the config endpoint; it reports `configured: false` and the key never leaves the server. |
| CO-23 | `create-agent` script: grounded system prompt (context numbers only, 2 sentences max), client tools schema | P0 | M | — | Done | Prompt and six client-tool schemas are written. The script has never been run: no agent exists and `ELEVENLABS_AGENT_ID` is unset, so the prompt is unproven against the model. |
| CO-24 | Conversation wiring: mic button active only in REST, hard gate outside, interrupted on REST exit | P0 | L | CO-20, CO-22 | Done | Gated three ways — `canTalk`, a `startTalk` bail that logs `agent_gate_blocked`, and a phase effect that ends the session on any REST exit including demo jumps. Never exercised against a live agent, because there is no key in the repo. |
| CO-25 | Context object rebuilt on every REST entry (dynamic vars + contextual update) | P0 | M | CO-24 | Done | Also re-sent whenever the pending adaptation changes. |
| CO-26 | Client tools: `log_rir`, `extend_rest`, `skip_rest`, `accept_adaptation`, `override_adaptation` | P0 | M | CO-24 | Done | All five are wired, plus `end_session`. `skip_rest` refuses while an adaptation is pending — the athlete cannot walk into a set the plan disowns — and the refusal is instrumented as `agent_gate_blocked`. Covered by a regression test. |
| CO-27 | Socket-drop fallback: agent goes quiet, Tier-0 carries on | P1 | S | CO-24 | Done | `onError` unducks, marks the agent inactive and logs `agent_disconnect`; the engine and cues are untouched. No reconnect and no explicit "coach dropped" message — the button simply returns to idle. |

## Epic 7 · Debrief & instrumentation (Block 6)

| ID | Task | Priority | Est | Deps | Status | Notes |
|---|---|---|---|---|---|---|
| CO-28 | Summary screen: volume, avg HR, duration tiles · recovery bar chart · insight callout | P0 | M | CO-13 | Done | Brief #42, the spoken comparison to the previous session, ships as one hardcoded cue line (`summary_compare`) on session complete. Nothing is computed — no previous session is stored — so treat it as scripted copy, not a result. |
| CO-29 | Adaptation log screen: every decision with its trigger | P0 | S | CO-18 | Done | |
| CO-30 | Telemetry: event stream (mute, cue latency, adaptations, gate blocks) → `POST /api/telemetry` | P0 | S | CO-5 | Done | 24 event types, batched and fire-and-forget, re-queued on failure; `cue_played` fires even when muted. Brief #44's "density changes" has no event because the app has no density control. |

## Epic 8 · Demo readiness

| ID | Task | Priority | Est | Deps | Status | Notes |
|---|---|---|---|---|---|---|
| CO-31 | Demo rig sidebar: 1×/4×/12× clock, state jumps (idle→log), breach-the-ceiling | P0 | M | CO-16 | Done | Also carries "Drop the strap" and jumps to override, abort, summary and log. Every jump loads a complete, internally consistent snapshot. Hidden below a 1100px viewport. |
| CO-32 | End-to-end rehearsal vs demo acceptance criteria · typecheck · build | P0 | M | all | Partial | `npm run typecheck` and `npm run build` both pass clean. The rehearsal has not happened: with no `.env`, no agent and no cue mp3s, the acceptance criteria that depend on Block 5 — spoken override, no invented numbers, mic behaviour on stage — are unverified, and every box in DEMO.md's acceptance list is still unticked. |

## Brief features with no board task

Recorded here so they are not mistaken for oversights.

| # | Feature | Status | Why |
|---|---|---|---|
| 13 | Haptic twin for every Tier 0 cue | Not done | Platform. There is no usable haptic API for this web target. Third in the brief's cut order. |
| 14 | Background playback with the screen locked | Not done | Platform. A browser tab loses audio when the screen locks, so a set cannot be run with the phone in a pocket. Say this plainly on stage rather than implying otherwise. |
| 15 | BLE chest strap / Apple Watch via HealthKit | Not done | Cut per the brief's cut order in favour of #17 replay. The product decision was dummy data for the MVP. |
| 30 | Overperformance rule (extra set offer) | Not done | CUT priority, first in the cut order. |
| 37 | Local intent routing before the network call | Not done | CUT priority, second in the cut order. |
| 42 | Spoken comparison to the previous session | Partial | Exists as the hardcoded `summary_compare` cue, not a computed comparison — see CO-28. |

## Open items before the demo

Human steps, in order:

- [ ] Create `.env` at the repo root with `ELEVENLABS_API_KEY` (copy `.env.example`).
- [ ] `npm run agent:create`, then **restart the API** — it reads `.env` at boot only. This writes `ELEVENLABS_AGENT_ID`.
- [ ] `npm run cues:generate`. Expect 27 mp3s in `apps/web/public/cues/`, one per manifest line. Until then every cue is browser speech synthesis.
- [ ] Grant microphone permission once, in the demo browser, on the demo origin. Do not let the prompt happen on stage.
- [ ] Rehearse against DEMO.md end to end at a viewport of 1200px or wider, and tick its acceptance list.

Code gaps found in this audit, all small:

- [x] ~~`skip_rest` leaves `pendingAdaptation` set (CO-26).~~ Fixed: the tool is refused while a sheet is open, with telemetry.
- [ ] The set screen promises "or just say done" but nothing listens during a set (CO-6). Change the copy or build the in-set path.
- [ ] `cueEngine.stopAll()` is dead code (CO-8). Decide whether the agent ducks Tier-0 or takes the floor, and make the interface match.
- [x] ~~DEMO.md says the cue directory should hold 26 mp3s; the manifest has 27 since `setup_set_4_capped` was added.~~ Corrected in DEMO.md and README.md.

## Cut order when behind (from the brief)

1. Overperformance rule (out of scope already) → 2. local intent routing → 3. haptics (n/a web) → 4. HR chart + spoken comparison → 5. live BLE (already cut — dummy data) → 6. Block 5 voice agent entirely.
Never cut CO-17 (RPE) or CO-30 (telemetry). Epics 4–5 are never cut.
Cuts 1, 2, 3 and 5 have been taken. The HR chart survived (CO-28); only the spoken comparison from step 4 is a stub.
