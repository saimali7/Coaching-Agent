# MVP — Feature List

**Product:** AI Voice Coach · Live Session Coaching
**Platform:** iOS · ElevenLabs Conversational AI
**Build budget:** 4 hours 30 (was 3:45 — heart rate adds ~45 min, see §Timeline)

**What the MVP proves:** a full session runs without touching the screen, the plan changes mid-session driven by real physiology, and the athlete can talk to the coach in the rest window.

Priorities: **MUST** — no demo without it · **SHOULD** — materially better · **CUT** — first to go when behind.

---

## Block 1 · Session core — Hour 1

| # | Feature | Priority |
|---|---|---|
| 1 | Session state machine: `IDLE → SET_ACTIVE ⇄ REST → COMPLETE` | MUST |
| 2 | Hardcoded programme: one movement, 4 sets × 8 reps, 60 kg | MUST |
| 3 | Tap-to-log reps, plus spoken confirmation ("done") | MUST |
| 4 | 90-second rest timer, auto-starts on set end | MUST |
| 5 | Session state store (Zustand) — single source of truth | MUST |
| 6 | Session screen: set, load, reps, timer. Dark, oversized type | MUST |

**Done when:** a session runs end to end and states transition cleanly.

---

## Block 2 · Tier 0 voice cues — Hour 2

All pre-recorded. No inference and no network inside a working set.

| # | Feature | Priority |
|---|---|---|
| 7 | Audio engine: cue queue, priorities, music ducking | MUST |
| 8 | Set-up cue: movement, load, target reps | MUST |
| 9 | Go signal — earcon, not speech | MUST |
| 10 | Spoken count of the last three reps | MUST |
| 11 | Talking rest timer: 20-second warning, call-in at zero | MUST |
| 12 | Transition cue into the next set | MUST |
| 13 | Haptic twin for every Tier 0 cue | SHOULD |
| 14 | Background playback with the screen locked | MUST |

**Done when:** a set can be completed with the phone in a pocket — voice carries the timing.

---

## Block 3 · Heart rate — Hour 2:30 to 3:15 ⭐ NEW

Heart rate is not a number on a screen. It is the input that makes in-session adaptation possible, and without it the differentiator is a guess.

| # | Feature | Priority |
|---|---|---|
| 15 | Device connection: BLE chest strap (primary) or Apple Watch via HealthKit | MUST |
| 16 | Live HR stream at 1 Hz into the session store | MUST |
| 17 | Deterministic replay mode — recorded HR trace for demo and dev | MUST |
| 18 | Zone model from max HR (age formula for MVP, user-overridable) | SHOULD |
| 19 | Live HR and zone on the session screen — glanceable, never required | MUST |
| 20 | **Inter-set recovery delta** — HR drop in the first 60s of each rest | MUST |
| 21 | Rolling recovery state: `good` / `ok` / `poor`, exposed to the rules engine | MUST |
| 22 | Strap-drop handling: announce once, session continues without adaptation | MUST |
| 23 | Safety ceiling: HR above threshold or non-responsive → abort protocol | MUST |

**Done when:** recovery delta is computed correctly across three consecutive rests and drives the adaptation state.

### Design notes

- **The metric that matters is #20, not raw HR.** Absolute heart rate tells you almost nothing between individuals; how fast it falls in the first minute of rest is the fatigue signal the whole adaptation rests on.
- **HR is almost never spoken aloud.** Reading "142 bpm" into someone's ear is a dashboard read-out, and it violates the rule that every cue must change what the athlete does next. HR speaks only through its consequences: an extended rest, a cut set, an abort.
- **Replay mode is not a shortcut, it is infrastructure.** You cannot develop or rehearse an HR-triggered adaptation against a live strap and your own pulse. Record one honest trace, replay it deterministically.
- **Age-based max HR is wrong by ±10–12 bpm** and fine for an MVP, as long as nothing safety-critical keys off the zone number. The abort in #23 uses an absolute ceiling, not a zone.

---

## Block 4 · Adaptation — Hour 3:15 to 4:00 ⭐

The core differentiator. Runs **without** the voice agent.

| # | Feature | Priority |
|---|---|---|
| 24 | **Spoken RPE capture** — "how many left in the tank?" → one spoken number | MUST |
| 25 | Recovery rule: two consecutive rests with recovery state `poor` | MUST |
| 26 | Action: cut remaining sets | MUST |
| 27 | Spoken adaptation with its reason — one sentence, in the rest window | MUST |
| 28 | Adaptation log: trigger, timestamp, decision | MUST |
| 29 | Silent rest extension — the only adaptation that is not announced | SHOULD |
| 30 | Overperformance rule: high RIR plus `good` recovery → offer an extra set | CUT |

> #24 was missing from the previous draft. The context object references `lastSetRPE` and the agent answers "should I go heavier?" from it — but nothing was capturing it. Without this, that answer is an invented number.

**Done when:** the session visibly shortens itself in front of the audience, and the coach says why.

> The rule decides. The model never decides. The agent only reports what has already been decided.

---

## Block 5 · Voice agent — Hour 4:00 to 4:45

| # | Feature | Priority |
|---|---|---|
| 31 | Microphone button, active **only** in `REST` | MUST |
| 32 | Hard gate: `onUserSpeech` ignores everything outside `REST` | MUST |
| 33 | Agent interrupted on `REST` exit — it must never speak into a working set | MUST |
| 34 | Context object rebuilt on every `REST` entry | MUST |
| 35 | ElevenLabs Conversational AI integration (ASR, TTS, VAD, turn-taking) | MUST |
| 36 | Grounded system prompt: only numbers present in context, two sentences max | MUST |
| 37 | Local intent routing before the network call: rest left, mute, skip, stop | SHOULD |
| 38 | Override handling: "I feel fine, let me finish" → concede plus compensate | MUST |
| 39 | Socket-drop fallback: Tier 0 keeps running, agent goes quiet | SHOULD |

**Questions it must answer:**

- "Should I go heavier?" → answered from last set's RPE
- "Why did you cut the set?" → the trigger, in plain words
- "How many reps next set?" → target plus the reason
- "I feel fine, let me finish" → concede, and name the compensation

---

## Block 6 · Debrief and instrumentation

| # | Feature | Priority |
|---|---|---|
| 40 | Session summary: volume, average HR, duration | MUST |
| 41 | HR recovery chart across the session's rests | SHOULD |
| 42 | Spoken comparison to the previous session (hardcoded for the demo) | SHOULD |
| 43 | Log screen: adaptations and overrides, each with its trigger | MUST |
| 44 | **Event telemetry** — screen unlocks, mute and density changes, cue latency, adaptation accepted vs overridden | MUST |

> #44 was also missing. Every success metric in the brief — screen unlocks per session, mute rate, cue latency — needs an event to fire against. Metrics with no instrumentation are decoration. It is 20 minutes of work now and unrecoverable data if skipped.

---

## Timeline

| Block | Window | Ships |
|---|---|---|
| 1 · Session core | 0:00–1:00 | A session you can walk through |
| 2 · Tier 0 cues | 1:00–2:00 | A hands-free set with spoken timing |
| 3 · Heart rate | 2:00–2:45 | Live HR plus recovery delta |
| 4 · Adaptation | 2:45–3:30 | **The moat moment** |
| 5 · Voice agent | 3:30–4:15 | The conversational layer |
| 6 · Debrief | 4:15–4:30 | Auditable session close |

Heart rate is the honest cost of the addition: **+45 minutes**, and it moves the total from 3:45 to 4:30. Two ways to claw it back if that does not fit:

- **Replay-only HR** (#17 without #15) saves ~30 minutes and demos identically. The strap becomes a post-demo integration. This is the recommended cut.
- **Drop Block 5** entirely and keep the build at 3:30 with a stronger physiological story. The adaptation is the differentiator; the agent is the wow.

---

## Not in the MVP

Named explicitly so it does not creep in:

- Automatic rep counting from the accelerometer — tap-to-log only
- Camera-based form analysis
- HRV, sleep, or recovery scores outside the session
- Endurance mode, zones-based pacing, intervals
- More than one movement in the programme
- Multiple coach voices or personas
- Languages other than English in the audio
- Android, watch-native sessions, offline cache
- Accounts, sign-in, cloud sync
- Historical trends across sessions

---

## Cut order when running behind

Cut strictly in this order:

1. Overperformance rule (#30)
2. Local intent routing (#37)
3. Haptics (#13)
4. HR recovery chart (#41) and spoken comparison (#42)
5. Live BLE strap → fall back to replay mode (#15 → #17)
6. Voice agent entirely (Block 5)

Never cut #24 (RPE capture) or #44 (telemetry) — the first makes the agent's load answers true, the second is the only way you learn anything from the demo.

**Blocks 3 and 4 are never cut.** Without heart rate the adaptation is fabricated, and without the adaptation this is a talking rest timer.

---

## Demo acceptance criteria

- [ ] The screen is never unlocked during the session
- [ ] Mid-set cues fire with no perceptible delay
- [ ] Live HR is visible and moving, from a real device or a deterministic replay
- [ ] Recovery delta degrades across the session and is visible in the log
- [ ] The adaptation fires on its own and is explained aloud in one sentence
- [ ] A spoken override is accepted, and the coach names the compensation
- [ ] No number in any spoken line is invented — all of it is in the context object
- [ ] Network loss does not break the session; Tier 0 carries on
- [ ] The tap-to-log shortcut is stated out loud before anyone spots it

---

## Two fixes to the demo script

**1.** The line "That moved fast" requires bar speed, which the MVP does not have. Ground it in RPE instead: *"You had two left in the tank. Add five pounds."* — same beat, and it is true.

**2.** The HR trace must be deterministic, whether replayed or live-with-fallback. The adaptation has to trigger on the third set exactly when it should. A demo whose centrepiece depends on the presenter's actual heart rate cooperating on stage is a demo that fails on stage.
