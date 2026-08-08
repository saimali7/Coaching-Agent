# TECH-SPEC

Cadence · Live Session Coach — real-time voice coaching during a strength session.

---

## 01 · Problem

**Who.** Lifters running a structured session, who already track something.

**The pain.** Measurement is solved — Whoop, Oura, Garmin and Apple will all tell you your recovery is 34%. None of them are standing next to you at 6:14am when your legs are heavy and the session needs to change. A plan is issued beforehand, an analysis arrives afterwards, and the 45 minutes where training actually happens are unattended.

**Why voice.** Mid-set, the athlete's eyes are on the bar and their hands are on it. Audio isn't a nicer interface — it's the only one physically available. A screen cannot reach the moment this product exists to serve.

**What that implies.** Under load, working memory collapses; a cue that's clear at rest is noise at rep nine. The hard problem isn't generating coaching language — it's deciding **when not to speak**. Everything below follows from that.

---

## 02 · Architecture

A React web app rendered inside an iOS device frame, plus an Express API. Not a native build — stated plainly because the framing is a presentation choice, not a claim. npm workspaces, ESM throughout, Node ≥ 20.

```
  Scripted HR trace (1 Hz, deterministic) ─┐
  Tap-to-log reps                         ─┼─►  SESSION STORE  (Zustand, 200 ms ticker)
  RIR captured in rest                    ─┘    IDLE → SET ⇄ REST → COMPLETE
                                                          │
                        ┌─────────────────────────────────┴────────────────────────┐
                        ▼                                                          ▼
              RULES ENGINE  engine/rules.ts                       COACH AGENT  ElevenLabs
              pure: deltas in, decision out                       WebSocket, REST-gated
              DECIDES cut · silent extension · abort              EXPLAINS the decision
                        │                                                          │
                        ▼                                                          ▼
              CUE ENGINE — 27 pre-rendered mp3s               signed URL from API; key
              public/cues, priority queue, ducking            never reaches the browser
              speechSynthesis fallback if unrendered
                        └──────────────────────┬───────────────────────────────────┘
                                               ▼
                                     SINGLE AUDIO CHANNEL
                               agent yields to a cue, never the reverse
```

**The store is the only source of truth.** One idempotent 200 ms ticker samples HR at 1 Hz, checks the safety ceiling, advances the rest countdown, and emits `CueRequest`s into a module-level sink. The engine imports no React; the cue engine is a singleton owned by the engine, so a re-render can never restart a cue mid-word.

**Rules decide, the model explains.** `engine/rules.ts` takes recovery deltas and returns a decision — no store, no clock, no audio, no model. The agent receives a `CoachContext` rebuilt on every REST entry and may speak only numbers present in it. An agent that *decides* can invent a reason to cut your sets: the failure mode users documented in Whoop Coach, which fabricates metrics it never read.

**The thresholds, in real numbers.** Recovery is the HR drop over the first 60 s of rest: **≥15 bpm good, 10–14 ok, <10 poor**. Two consecutive poor rests cut the remaining sets. The *first* poor rest instead buys a **silent +20 s extension — the only adaptation never announced**. Safety ceiling is **182 bpm absolute** and deliberately not zone-derived, requiring three consecutive samples so one artefact cannot stop a session. Override compensation is real, not a phrase: the final set is capped at **6 reps**.

**A missing measurement is never a bad one.** A rest with no closed window (strap dropped, session jumped) classifies as `unknown` and is ignored by the rules entirely. Silence in the data must not be readable as evidence.

**No `Math.random`, no `Date.now()` anywhere in the engine.** The trace, the deltas and the adaptation replay identically every run, or the demo is a coin flip.

---

## 03 · Tool rationale

**ElevenLabs, used twice and for different reasons.**

*Conversational AI* for the rest-window agent — chosen for turn-taking, barge-in and interruption, not for the voice. Those are the expensive part to build and the part a live demo dies on. It exposes six client tools (`log_rir`, `extend_rest`, `skip_rest`, `accept_adaptation`, `override_adaptation`, `end_session`), so the conversation drives the same store the UI does rather than running beside it. The browser never sees the API key: the client requests a short-lived signed URL from `GET /api/voice/signed-url`, and the server fetches it with the key in a header.

*TTS, pre-rendered* for the 27 in-set cues, generated once by `npm run cues:generate` into `public/cues` and played as local files. Same `ELEVENLABS_VOICE_ID` as the agent, so the recorded lines and the live agent are not two different coaches. This is what keeps the network out of a working set — the mid-set path touches nothing remote, and an unrendered manifest degrades to browser `speechSynthesis` rather than silence.

**context.dev and Devin were not used.** Being direct about it, because the repo is checkable. context.dev was scoped for a grounded movement corpus so the agent could answer technique questions from references rather than priors — but with a single hardcoded movement and a grounding rule that already forbids un-sourced claims, the agent declines technique questions instead, which is cheaper and equally safe. It becomes necessary the moment the movement library grows. Devin was scoped to parallelise the mechanical half of the build; at this size the cue manifest and telemetry wiring were faster to write than to specify.

---

## 04 · Feasibility — scoped to 6 hours

Six blocks, each leaving something demoable. The order is the argument: the differentiator lands before anything that depends on a network.

| Hour | Block | What shipped |
|---|---|---|
| 1 | Session core | Store, state machine, 200 ms ticker, tap-to-log, rest countdown |
| 2 | Tier 0 cues | Cue manifest, priority queue, ducking, earcon, TTS render script |
| 3 | Heart rate | Deterministic 1 Hz simulator, zone model, 60 s recovery delta |
| 4 | Adaptation | Pure rules engine, cut, silent extension, safety abort, adaptation log |
| 5 | Voice agent | Signed-URL flow, REST gate, `CoachContext`, six client tools |
| 6 | Close | Summary, telemetry, demo rig, single-origin serve — no new product scope |

**Cuts, and why each is safe:** heart rate is a scripted trace, not a sensor — `HrStatus.source` has exactly one value, `'replay'`, and no BLE or HealthKit exists in this build · rep logging is tap-only · one movement, barbell back squat 4 × 8 at 60 kg · nothing persists past a reload · English, one voice, one persona · web, so no haptics and no background playback with the screen locked.

**The trace is infrastructure, not a shortcut.** Peaks of 143/152/158/163 bpm from an 88 bpm baseline, with 60 s drops of 19/8/6/5 — that is good, poor, poor, which fires the cut in rest 3 and cuts the final set, every single run. An adaptation that depends on the presenter's actual pulse cooperating on stage is a demo that fails on stage.

**The risk we architected around:** the agent lands in Hour 5, *after* the differentiator. If the ElevenLabs socket dies mid-demo, Tier 0 cues, the state machine, the rules engine and the adaptation all still run from local files. The talk button reads "Coach offline" and everything else is unchanged.

**Verification is typecheck, build, and 45 engine tests** — `node:test` via `tsx`, driving the store through the exported `advance(dtMs)` rather than wall-clock waits. That export exists precisely so determinism is testable: the suite steps the session forward and asserts the deltas, the cut, the override cap and every demo-jump snapshot. There is no linter and no formatter, deliberately.

---

## 05 · Extensibility

Every extension plugs into an existing seam rather than reopening the design.

- **Real heart rate** replaces `hrSim` behind the existing `HrStatus` interface — `source` becomes a union instead of the literal `'replay'`. The rules engine never learns where the number came from.
- **More adaptation triggers** are new branches in the same pure `evaluate()`, emitting the same outcome shape: bar-speed decay, HR/pace decoupling, reported symptom.
- **IMU rep counting** replaces tap input at the store boundary — confidence-thresholded, silent below threshold, because one wrong count spoken aloud costs more trust than ten silent sets.
- **A movement library** is where context.dev earns its place: technique answers need a grounded corpus before the agent is allowed to give them.
- **Endurance mode** is a second cue profile against the same tiers — zone pacing with a hysteresis band, interval callouts.
- **Native** buys haptics, background audio with the screen locked, and a watch app. The engine is framework-free and portable as-is; the React layer is not.

**Fixed permanently:** the store as sole arbiter of speech · rules decide, the agent explains · no network in the mid-set path · a missing measurement is never a bad one · silence as the default.

**Never built:** our own wearable — we ride on Whoop, Oura, Garmin and Apple, and owning the wrist distracts from owning the ear. Diagnosis of any kind — we escalate, we don't diagnose.
