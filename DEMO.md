# Demo runbook

The stage script for the AI voice coach MVP. Four minutes, one movement, one adaptation that fires on its own.

## Before you go on

- [ ] `.env` exists at the repo root and contains both `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID`. If the agent id is missing, run `npm run agent:create` and **restart the API** — it only reads `.env` at boot.
- [ ] `npm run cues:generate` has been run. Check `apps/web/public/cues` is populated — it should hold 27 mp3s, one per line in `apps/web/src/audio/cue-manifest.json`. An empty directory means every cue falls back to browser speech synthesis, which works but sounds like a different coach.
- [ ] Both dev servers are up, in separate terminals: `npm run dev:api` (:3000) and `npm run dev:web` (:5173). Do not use `npm run dev` — it runs workspaces sequentially and never reaches the web app.
- [ ] http://localhost:5173 is open at a viewport of **1200px or wider**. Below 1100px the phone frame flattens and the demo rig disappears entirely.
- [ ] Microphone permission has been granted once already, in this browser, on this origin. Do not let the permission prompt happen on stage.
- [ ] System volume up, and audio is coming out of the room's speakers, not the laptop.
- [ ] Do one silent dry run and then reload the page. The store is in-memory, so a reload is a clean slate.

## The four-minute script

Run at 1× until set 1 is done, then 4× for the rest. The demo rig sits in the right-hand sidebar.

| Time | Action | What the audience sees and hears | Why it matters |
|---|---|---|---|
| 0:00 | Say the shortcut line, then press **Start training** | "Barbell back squat. Sixty kilos on the bar, eight reps. Set one of four. Take your position." Then the go earcon — a tone, not a word | The plan is spoken before anything begins. The go signal is deliberately not speech |
| 0:10 | Tap the big **Tap to log a rep** target eight times | Silence for reps 1–5, then "Six." "Seven." "Eight." Then "Done. Rack it. Rest starts now." | Only the last three reps are counted out loud. Everything else would be noise |
| 0:35 | Rest 1 starts on its own. Switch the rig clock to **4×** | The countdown accelerates. HR starts falling in the header | Real rest is 90 seconds. The physiology is unchanged; only the clock is compressed |
| 0:38 | The coach asks "How many did you have left in the tank?" — tap **RIR 2** | "Logged." | This is why the load answer later is true and not invented |
| 0:50 | Let the recovery window close | REST 1 tile turns to **−19**, green | 19 bpm in the first 60 seconds. That is a good recovery, and nothing is said about it — HR only speaks through consequences |
| 1:00 | Set 2 starts by itself. Tap eight reps | "Set two. Same bar, sixty kilos, eight reps." Counts, then the rack cue | Hands-free between sets. Nobody touched the screen except to log |
| 1:25 | Rest 2. Let it run | REST 2 tile lands on **−8**, amber-to-red. **Nothing is announced.** The countdown quietly has 20 extra seconds on it | Say this out loud: the coach just extended the rest and deliberately did not tell them. It is the only adaptation that is never spoken |
| 1:55 | Set 3. Tap eight reps | Third set-up cue, counts, rack | — |
| 2:10 | Rest 3 begins. **Press the talk button immediately**, before the countdown reaches 60 seconds remaining | The orb switches to listening | The adaptation sheet covers the screen when it opens, so open the conversation first. Once connected it survives the sheet and gets the new context automatically |
| 2:20 | Let the recovery window close. Do nothing | REST 3 lands on **−6**. The coach speaks unprompted: "Change of plan. Your recovery dropped on two rests in a row, so I am cutting the final set." The sheet slides up with the trigger and the numbers. The rest countdown freezes | The moment. A rule fired on physiology, on its own, and explained itself in one sentence. Nobody pressed anything |
| 2:35 | Ask: **"Why did you cut the set?"** | The trigger back in plain words — two consecutive poor rests, with the actual drops | The model did not decide anything. It is reading a decision that already exists |
| 2:50 | Ask: **"Should I go heavier?"** | Answered from the RIR you logged at 0:38 — two in reserve, so add 2.5 kilos next session, not today | Ground it out loud in RPE, not bar speed. The MVP does not measure bar speed |
| 3:05 | Say: **"I feel fine, let me finish."** | The coach concedes once and names the compensation: the final set is capped at six reps, same bar. The sheet closes, the countdown resumes | Concede plus compensate. The athlete keeps authority; the coach keeps its judgement on the record |
| 3:20 | Rest 3 ends. Set 4 starts. Tap **six** reps | The hero counter reads "of 6 reps · set 4". Session completes and the screen moves itself to the summary | The compensation is real, not a phrase — the rep target actually changed |
| 3:40 | Land on **/summary** | Volume, average HR, sets completed of planned, last recovery. The recovery bar chart shows the whole session degrading. Instrumentation card: cue count, median cue latency, adaptations accepted vs overridden | Every metric in the brief has an event behind it |
| 3:50 | Tap **Open the log** | `/log`: the silent rest extension (auto), and the cut (overridden) with its compensation | Auditable. Every decision, its trigger, and whether it was taken |

## The insurance

The demo rig in the right sidebar is presenter-only and never part of the product. It is hidden below a 1100px viewport.

| Control | What it does | Use it when |
|---|---|---|
| **1× / 4× / 12×** | Multiplies session time, not wall time | 12× skips a rest window in about seven seconds |
| **Jump to state** — Idle, Set, Rest, Adapt, Override, Abort, Summary, Log | Loads a complete, internally consistent snapshot: HR trace, deltas, set log and adaptation log all from the same scripted timeline | Anything drifts. Jump straight to the beat you were heading for; the numbers on screen will still be honest |
| **Breach the ceiling** | Drives HR past 182 bpm in about four seconds | Showing the safety abort: full-screen stop, "Stop. Rack the bar now. Your heart rate is above the ceiling." The ceiling is an absolute number, not a zone |
| **Drop the strap** | Marks HR disconnected | Showing the strap-loss path: announced once, session continues, and no further adaptation can fire — an unmeasured rest is `unknown`, never `poor` |

The rig also shows live phase, HR, rolling recovery, whether the rule is armed or fired, RIR, clock and event count. Glance at it, do not narrate it.

## The lines that must be said out loud

- **State the tap-to-log shortcut before anyone spots it.** Something like: "Rep logging is a tap in this build — no accelerometer counting. Everything else in the session is hands-free." Said first, it is a scoping decision. Said after someone notices, it is a hole.
- **Ground the load answer in RPE, never bar speed.** "You had two left in the tank" is measured — the RIR was captured in the rest window. "That moved fast" needs bar velocity, which this MVP does not measure, so it would be an invented number.
- **Name the silent extension when it happens.** The audience cannot hear something that was deliberately not said. Point at the countdown gaining 20 seconds and explain that this is the one adaptation the coach keeps to itself.
- **Say that the heart rate is a deterministic replay.** It is infrastructure, not a fudge: an adaptation whose trigger depends on the presenter's actual pulse cooperating on stage is a demo that fails on stage.

## Acceptance criteria

From the brief's demo acceptance criteria, verbatim:

- [ ] The screen is never unlocked during the session
- [ ] Mid-set cues fire with no perceptible delay
- [ ] Live HR is visible and moving, from a real device or a deterministic replay
- [ ] Recovery delta degrades across the session and is visible in the log
- [ ] The adaptation fires on its own and is explained aloud in one sentence
- [ ] A spoken override is accepted, and the coach names the compensation
- [ ] No number in any spoken line is invented — all of it is in the context object
- [ ] Network loss does not break the session; Tier 0 carries on
- [ ] The tap-to-log shortcut is stated out loud before anyone spots it

## If it breaks

**The network drops.** Tier 0 keeps running — every in-set cue is a local file, and the state machine, the HR trace and the rules engine touch nothing remote. The agent goes quiet and the talk button stops connecting. Telemetry queues locally and retries. Say it on stage: this is the designed failure mode, and it is the difference between a coach and a chatbot.

**No cue audio.** The cue engine falls back to the browser's speech synthesis and reads the same manifest text. It sounds noticeably different from the ElevenLabs voice — that is expected, not a fault. If the whole app is silent, the browser has not had a user gesture yet: press Start training (which primes the audio context) rather than jumping straight in with the rig.

**The mic is blocked or the agent will not connect.** Check `GET /api/voice/status` — `configured: false` means the API has no key or no agent id, and the talk button will read "Coach offline". Run the demo without the conversation: use the rig's state jumps for the adaptation beat, and resolve the sheet with its two on-screen buttons. "I feel fine, let me finish" is a button as well as a sentence, and it speaks the same compensation line.

**Two wrinkles to be aware of, both real:**

- The adaptation sheet covers the whole phone screen, including the talk button. Start the conversation *before* the cut fires, as the script above does; once connected, the agent is sent the new context automatically and can still be talked to while the sheet is up.
- If you override, the set-up cue for set 4 still says "eight reps" while the on-screen target and the compensation are six. The screen and the override acknowledgement are correct; that one pre-recorded line is not. Do not draw attention to it, and if someone catches it, it is a fixed cue line that has not been re-cut for the override path.
