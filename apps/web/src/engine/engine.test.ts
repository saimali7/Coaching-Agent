import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

import { hrSim } from './hrSim';
import {
  HR_SCRIPT,
  PROGRAMME,
  REST_WARNING_SEC,
  SAFETY_CEILING_BPM,
  SILENT_REST_EXTENSION_SEC,
} from './programme';
import { classify } from './recovery';
import { OVERRIDE_COMPENSATION, OVERRIDE_REP_CAP, evaluate } from './rules';
import { advance, setCueSink, stopEngineTicker, useSessionStore } from './sessionStore';
import type { DemoRoute } from './sessionStore';
import { stopTelemetryFlusher } from './telemetry';
import type {
  CueRequest,
  DemoJumpTarget,
  RecoveryDelta,
  RecoveryState,
  SessionPhase,
  TelemetryType,
} from './types';

// Determinism harness for the session engine.
//
// The store, the HR simulator and the telemetry queue are module singletons, so every
// test resets all three and drives the clock by hand: the real 200 ms ticker is stopped
// the moment a session starts and `step()` below is the only thing that moves time.
// Nothing here sleeps, and nothing here touches the network.

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

const state = () => useSessionStore.getState();

/** One engine step. `advance` runs the engine but never moves the clock — the ticker owns that. */
const step = (ms = 1000): void => {
  useSessionStore.setState({ sessionClock: state().sessionClock + ms });
  advance(ms);
};

const stepTimes = (n: number): void => {
  for (let i = 0; i < n; i += 1) step();
};

/** Step until the predicate goes false, with a hard cap so a stuck engine fails fast. */
const stepWhile = (predicate: () => boolean, max = 400): number => {
  let taken = 0;
  while (predicate() && taken < max) {
    step();
    taken += 1;
  }
  assert.ok(taken < max, `engine did not settle within ${max} simulated seconds`);
  return taken;
};

let cues: CueRequest[] = [];

const cueIds = (): string[] => cues.map((c) => c.id);

/** Begin a session with the real-time ticker disabled. */
const beginSession = (): void => {
  state().startSession();
  stopEngineTicker();
};

/** Log every rep of the set currently in progress, four simulated seconds apart. */
const workCurrentSet = (secondsPerRep = 4): void => {
  const target = state().sets.at(-1)?.targetReps ?? 0;
  assert.ok(target > 0, 'expected a set in progress');
  for (let rep = 0; rep < target; rep += 1) {
    stepTimes(secondsPerRep);
    state().logRep();
  }
};

/** Step until the current rest window releases (or an adaptation sheet freezes it). */
const runRest = (): void => {
  stepWhile(() => state().phase === 'rest' && state().pendingAdaptation === null, 300);
};

/** Set 1 → rest 1 → set 2 → rest 2 → set 3 → rest 3, stopping the moment the cut is proposed. */
const runToPendingCut = (): void => {
  beginSession();
  for (let guard = 0; guard < PROGRAMME.plannedSets; guard += 1) {
    if (state().pendingAdaptation !== null || state().phase === 'complete') return;
    workCurrentSet();
    runRest();
  }
};

const telemetryTypes = (): TelemetryType[] => state().telemetry.map((e) => e.type);

const computedDelta = (setNumber: number, drop: number): RecoveryDelta => ({
  setNumber,
  hrAtRestStart: 150,
  hrAt60s: 150 - drop,
  delta: drop,
  state: classify(drop, true),
});

const unknownDelta = (setNumber: number): RecoveryDelta => ({
  setNumber,
  hrAtRestStart: 150,
  hrAt60s: null,
  delta: null,
  state: 'unknown',
});

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

const realFetch = globalThis.fetch;

before(() => {
  // The telemetry sender is fire-and-forget but real: stub it so no test ever
  // opens a socket, and so a failed POST cannot re-queue events between tests.
  globalThis.fetch = (() =>
    Promise.resolve(new Response(null, { status: 204 }))) as typeof globalThis.fetch;
});

after(() => {
  stopEngineTicker();
  stopTelemetryFlusher();
  setCueSink(null);
  globalThis.fetch = realFetch;
});

beforeEach(() => {
  stopEngineTicker();
  state().resetSession();
  hrSim.reset();
  cues = [];
  setCueSink((cue) => {
    cues.push(cue);
  });
});

// ---------------------------------------------------------------------------
// 1. HR simulation
// ---------------------------------------------------------------------------

describe('hr simulation replays identically every run', () => {
  it('produces byte-identical bpm traces for two runs of the same scripted session', () => {
    runToPendingCut();
    const first = state().samples.map((s) => s.bpm);

    state().resetSession();
    hrSim.reset();
    runToPendingCut();
    const second = state().samples.map((s) => s.bpm);

    assert.ok(first.length > 300, 'expected a full scripted session of samples');
    assert.deepEqual(second, first);
  });

  it('lands the three measured recovery drops on the scripted 19 / 8 / 6', () => {
    runToPendingCut();
    const deltas = state().recovery.deltas;

    assert.equal(deltas.length, 3);
    deltas.forEach((d, i) => {
      const scripted = HR_SCRIPT.restDrops[i];
      assert.ok(scripted !== undefined);
      assert.ok(d.delta !== null, `rest ${i + 1} never closed its 60 s window`);
      assert.ok(
        Math.abs(d.delta - scripted) <= 2,
        `rest ${i + 1} drop was ${d.delta}, expected ~${scripted}`,
      );
    });
  });

  it('classifies the scripted session as good, then poor, then poor', () => {
    runToPendingCut();
    assert.deepEqual(
      state().recovery.deltas.map((d) => d.state),
      ['good', 'poor', 'poor'],
    );
  });

  it('drives heart rate past the safety ceiling within ten simulated seconds of a forced breach', () => {
    hrSim.reset();
    hrSim.forceBreach();

    let peak = 0;
    for (let sec = 1; sec <= 10; sec += 1) {
      peak = Math.max(
        peak,
        hrSim.sample({ phase: 'set', setNumber: 1, clockMs: sec * 1000, restElapsedMs: 0 }),
      );
    }

    assert.ok(peak > SAFETY_CEILING_BPM, `peak was ${peak}, ceiling is ${SAFETY_CEILING_BPM}`);
  });

  it('never emits a NaN or negative bpm across a whole session', () => {
    runToPendingCut();
    const samples = state().samples;
    assert.ok(samples.length > 0);
    samples.forEach((s) => {
      assert.ok(Number.isFinite(s.bpm), `non-finite bpm at t=${s.t}`);
      assert.ok(s.bpm > 0, `non-positive bpm ${s.bpm} at t=${s.t}`);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Recovery classification
// ---------------------------------------------------------------------------

describe('recovery classification is a pure table', () => {
  const cases: ReadonlyArray<{
    delta: number | null;
    connected: boolean;
    expected: RecoveryState;
  }> = [
    { delta: 19, connected: true, expected: 'good' },
    { delta: 15, connected: true, expected: 'good' },
    { delta: 14, connected: true, expected: 'ok' },
    { delta: 10, connected: true, expected: 'ok' },
    { delta: 9, connected: true, expected: 'poor' },
    { delta: 0, connected: true, expected: 'poor' },
    { delta: null, connected: true, expected: 'unknown' },
    { delta: 19, connected: false, expected: 'unknown' },
    { delta: 0, connected: false, expected: 'unknown' },
  ];

  cases.forEach(({ delta, connected, expected }) => {
    it(`a ${delta === null ? 'missing' : `${delta} bpm`} drop with the strap ${
      connected ? 'on' : 'off'
    } reads ${expected}`, () => {
      assert.equal(classify(delta, connected), expected);
    });
  });
});

// ---------------------------------------------------------------------------
// 3. Rules engine
// ---------------------------------------------------------------------------

describe('the rule decides the cut, and only the rule', () => {
  const ctx = {
    alreadyProposedCut: false,
    alreadyExtendedThisRest: false,
    remainingSets: 1,
  };

  it('proposes a cut after two consecutive poor rests, quoting both real drops', () => {
    const outcome = evaluate([computedDelta(1, 19), computedDelta(2, 8), computedDelta(3, 6)], ctx);

    assert.ok(outcome.proposeCut, 'expected a cut proposal');
    assert.match(outcome.proposeCut.trigger, /8/);
    assert.match(outcome.proposeCut.trigger, /6/);
    assert.ok(!outcome.silentExtension);
  });

  it('buys a silent twenty seconds on the first poor rest instead of cutting', () => {
    const outcome = evaluate([computedDelta(1, 19), computedDelta(2, 8)], ctx);

    assert.equal(outcome.silentExtension, true);
    assert.equal(outcome.proposeCut, undefined);
  });

  it('never proposes the cut twice', () => {
    const outcome = evaluate([computedDelta(1, 8), computedDelta(2, 6)], {
      ...ctx,
      alreadyProposedCut: true,
    });

    assert.equal(outcome.proposeCut, undefined);
    assert.equal(outcome.silentExtension, undefined);
  });

  it('ignores unknown rests rather than counting them as poor', () => {
    const outcome = evaluate([computedDelta(1, 8), unknownDelta(2)], ctx);

    assert.equal(outcome.proposeCut, undefined, 'an unknown rest must not complete a poor streak');
    assert.equal(outcome.silentExtension, true);
  });

  it('sees straight through an unknown rest that interrupts a poor streak', () => {
    const outcome = evaluate([computedDelta(1, 8), unknownDelta(2), computedDelta(3, 6)], ctx);

    assert.ok(outcome.proposeCut, 'two measured poor rests still make a streak');
  });

  it('does not propose cutting sets that do not exist', () => {
    const outcome = evaluate([computedDelta(1, 8), computedDelta(2, 6)], {
      ...ctx,
      remainingSets: 0,
    });

    assert.equal(outcome.proposeCut, undefined);
  });
});

// ---------------------------------------------------------------------------
// 4. Session state machine
// ---------------------------------------------------------------------------

describe('the session state machine', () => {
  it('starts at set one with an eight-rep target', () => {
    assert.equal(state().phase, 'idle');
    beginSession();

    const s = state();
    assert.equal(s.phase, 'set');
    assert.equal(s.currentSet, 1);
    assert.equal(s.sets.length, 1);
    assert.equal(s.sets[0]?.setNumber, 1);
    assert.equal(s.sets[0]?.targetReps, PROGRAMME.targetReps);
    assert.equal(s.sets[0]?.loadKg, PROGRAMME.loadKg);
  });

  it('ends the set on the eighth rep and opens a ninety second rest', () => {
    beginSession();
    workCurrentSet();

    const s = state();
    assert.equal(s.phase, 'rest');
    assert.equal(s.sets[0]?.repsCompleted, PROGRAMME.targetReps);
    assert.notEqual(s.sets[0]?.endedAt, null);
    assert.equal(s.rest.secondsLeft, PROGRAMME.restSeconds);
    assert.equal(s.rest.endsAtClock, s.rest.startedAtClock! + PROGRAMME.restSeconds * 1000);
  });

  it('counts the rest down, warns once at twenty seconds, and releases into the next set', () => {
    beginSession();
    workCurrentSet();

    const restStart = state().rest.startedAtClock ?? 0;
    stepTimes(30);
    assert.equal(state().rest.secondsLeft, PROGRAMME.restSeconds - 30);
    assert.equal(cueIds().filter((id) => id === 'rest_20').length, 0);

    stepWhile(() => state().sessionClock < restStart + 1000 * (PROGRAMME.restSeconds - 1), 200);
    assert.equal(state().rest.secondsLeft, 1);
    assert.equal(cueIds().filter((id) => id === 'rest_20').length, 1, 'the warning fires once');
    assert.equal(state().phase, 'rest');

    step();
    assert.equal(state().phase, 'set');
    assert.equal(state().currentSet, 2);
    assert.equal(state().sets.length, 2);
    assert.equal(cueIds().filter((id) => id === 'rest_20').length, 1);
  });

  it('ignores reps logged during a rest window', () => {
    beginSession();
    workCurrentSet();
    assert.equal(state().phase, 'rest');

    const before = state().sets.map((s) => s.repsCompleted);
    const repEventsBefore = telemetryTypes().filter((t) => t === 'rep_logged').length;
    state().logRep();
    state().logRep();

    assert.deepEqual(
      state().sets.map((s) => s.repsCompleted),
      before,
    );
    assert.equal(state().phase, 'rest');
    assert.equal(state().sets.length, 1, 'a stray rep must not open a new set');
    assert.equal(
      telemetryTypes().filter((t) => t === 'rep_logged').length,
      repEventsBefore,
      'a rep logged in rest is not recorded at all',
    );
  });

  it('completes the session when the final set finishes', () => {
    beginSession();
    for (let n = 1; n < PROGRAMME.plannedSets; n += 1) {
      workCurrentSet();
      assert.equal(state().phase, 'rest');
      state().skipRest();
    }
    assert.equal(state().currentSet, PROGRAMME.plannedSets);
    workCurrentSet();

    assert.equal(state().phase, 'complete');
    assert.equal(state().sets.length, PROGRAMME.plannedSets);
    assert.ok(cueIds().includes('session_done'));
  });
});

// ---------------------------------------------------------------------------
// 5. The adaptation, end to end
// ---------------------------------------------------------------------------

describe('the adaptation fires on stage', () => {
  it('proposes the cut in the third rest and freezes the countdown until the athlete answers', () => {
    runToPendingCut();

    const s = state();
    assert.equal(s.phase, 'rest');
    assert.equal(s.currentSet, 3);
    assert.ok(s.pendingAdaptation, 'expected a pending adaptation');
    assert.equal(s.pendingAdaptation.kind, 'cut_sets');
    assert.equal(s.pendingAdaptation.status, 'proposed');
    assert.equal(s.pendingAdaptation.setNumber, 3);
    assert.ok(s.pendingAdaptation.trigger.length > 0);
    assert.deepEqual(
      s.recovery.deltas.map((d) => d.state),
      ['good', 'poor', 'poor'],
    );
    assert.ok(cueIds().includes('adapt_cut'));
    assert.equal(s.rest.frozen, true);

    const frozenAt = s.rest.secondsLeft;
    stepTimes(10);
    assert.equal(state().rest.secondsLeft, frozenAt, 'the timer waits while the sheet is open');
    assert.equal(state().phase, 'rest');
    assert.equal(state().currentSet, 3);
  });

  it('accepting the cut ends the session there and logs the decision as accepted', () => {
    runToPendingCut();
    const setsBefore = state().sets.length;

    state().acceptAdaptation();

    const s = state();
    assert.equal(s.phase, 'complete');
    assert.equal(s.pendingAdaptation, null);
    assert.equal(s.plannedSetsDynamic, 3);
    const cut = s.adaptations.find((a) => a.kind === 'cut_sets');
    assert.ok(cut, 'the cut must be in the adaptation log');
    assert.equal(cut.status, 'accepted');

    stepTimes(20);
    assert.equal(state().sets.length, setsBefore, 'no further sets may start');
    assert.equal(state().phase, 'complete');
  });

  it('overriding the cut keeps the final set but caps it at six reps, and says so', () => {
    runToPendingCut();

    state().overrideAdaptation();

    const overridden = state().adaptations.find((a) => a.kind === 'cut_sets');
    assert.ok(overridden);
    assert.equal(overridden.status, 'overridden');
    assert.equal(overridden.compensation, OVERRIDE_COMPENSATION);
    assert.equal(state().rest.frozen, false, 'the rest resumes once the sheet is resolved');
    assert.equal(state().pendingAdaptation, null);

    const before = state().rest.secondsLeft;
    step();
    assert.ok(state().rest.secondsLeft < before, 'the countdown moves again');

    cues = [];
    stepWhile(() => state().phase === 'rest', 200);

    const s = state();
    assert.equal(s.phase, 'set');
    assert.equal(s.currentSet, PROGRAMME.plannedSets);
    assert.equal(s.sets.at(-1)?.targetReps, OVERRIDE_REP_CAP);
    assert.ok(cueIds().includes('setup_set_4_capped'), `cues were ${cueIds().join(', ')}`);
    assert.ok(!cueIds().includes('setup_set_4'));
  });

  it('refuses to skip a rest while the decision is still on the screen', () => {
    runToPendingCut();

    const before = state();
    assert.ok(before.pendingAdaptation, 'precondition: the sheet is open');

    state().skipRest();

    const after = state();
    assert.equal(after.phase, 'rest', 'the athlete cannot walk into a set the plan disowns');
    assert.equal(after.currentSet, before.currentSet);
    assert.equal(after.sets.length, before.sets.length, 'no new set was started');
    assert.notEqual(after.pendingAdaptation, null, 'the decision is still pending');
    assert.ok(
      after.telemetry.some(
        (e) =>
          e.type === 'agent_gate_blocked' &&
          e.data?.reason === 'skip_rest_with_pending_adaptation',
      ),
      'the blocked skip is instrumented',
    );

    // Once answered, the same call is allowed through.
    state().overrideAdaptation();
    state().skipRest();
    assert.equal(state().phase, 'set');
    assert.equal(state().currentSet, before.currentSet + 1);
  });

  it('extends the first poor rest by twenty seconds without saying a word', () => {
    beginSession();
    workCurrentSet(); // set 1 → rest 1
    runRest();
    workCurrentSet(); // set 2 → rest 2, the first poor recovery

    assert.equal(state().currentSet, 2);
    assert.equal(state().phase, 'rest');

    // Snapshot the instant *before* the step that closes the 60 s window, so the
    // comparison brackets exactly the moment the extension is applied.
    let cuesBefore = cues.length;
    let endsBefore = state().rest.endsAtClock ?? 0;
    let taken = 0;
    while (state().recovery.deltas.at(-1)?.delta === null && taken < 200) {
      cuesBefore = cues.length;
      endsBefore = state().rest.endsAtClock ?? 0;
      step();
      taken += 1;
    }
    assert.ok(taken < 200, 'the recovery window never closed');

    const s = state();
    assert.equal(s.recovery.deltas.at(-1)?.state, 'poor');
    assert.equal(
      s.rest.endsAtClock,
      endsBefore + SILENT_REST_EXTENSION_SEC * 1000,
      'the rest grows by exactly twenty seconds',
    );
    assert.equal(cues.length, cuesBefore, 'the silent extension is never announced');
    assert.equal(s.rest.frozen, false, 'nothing to resolve — the athlete is not told');

    const extension = s.adaptations.find((a) => a.kind === 'extend_rest');
    assert.ok(extension, 'the extension is still logged');
    assert.equal(extension.status, 'auto');
    assert.equal(extension.detail.addedRestSec, SILENT_REST_EXTENSION_SEC);
  });
});

// ---------------------------------------------------------------------------
// 6. Safety ceiling
// ---------------------------------------------------------------------------

describe('the safety ceiling stops the session from either phase', () => {
  const assertAborted = (): void => {
    const s = state();
    assert.equal(s.phase, 'aborted');
    assert.ok(s.aborted, 'expected an abort record');
    assert.ok(s.aborted.reason.length > 0);
    assert.ok(s.aborted.hrAtAbort > SAFETY_CEILING_BPM);

    const abortCue = cues.find((c) => c.id === 'abort');
    assert.ok(abortCue, 'the abort cue must reach the sink');
    assert.equal(abortCue.priority, 'critical');
    assert.ok(telemetryTypes().includes('safety_ceiling_breach'));
    assert.ok(telemetryTypes().includes('session_abort'));
  };

  it('aborts out of a working set', () => {
    beginSession();
    stepTimes(20);
    assert.equal(state().phase, 'set');

    state().breachCeiling();
    stepWhile(() => state().phase !== 'aborted', 30);

    assertAborted();
  });

  it('aborts out of a rest window', () => {
    beginSession();
    workCurrentSet();
    assert.equal(state().phase, 'rest');

    state().breachCeiling();
    stepWhile(() => state().phase !== 'aborted', 30);

    assertAborted();
  });
});

// ---------------------------------------------------------------------------
// 7. Strap drop
// ---------------------------------------------------------------------------

describe('a dropped strap can never fabricate an adaptation', () => {
  it('announces the drop once and reports every later rest as unknown', () => {
    beginSession();
    stepTimes(5);

    state().dropStrap();
    state().dropStrap();

    assert.equal(cueIds().filter((id) => id === 'strap_drop').length, 1);
    assert.equal(state().hr.connected, false);
    assert.equal(telemetryTypes().filter((t) => t === 'hr_strap_drop').length, 1);

    for (let n = 1; n < PROGRAMME.plannedSets; n += 1) {
      workCurrentSet();
      runRest();
    }
    workCurrentSet();

    const s = state();
    assert.equal(s.phase, 'complete');
    assert.equal(s.recovery.deltas.length, PROGRAMME.plannedSets - 1);
    s.recovery.deltas.forEach((d) => {
      assert.equal(d.delta, null);
      assert.equal(d.state, 'unknown');
    });
    assert.equal(s.recovery.rolling, 'unknown');
    assert.equal(s.pendingAdaptation, null);
    assert.equal(
      s.adaptations.filter((a) => a.kind === 'cut_sets').length,
      0,
      'no cut may be invented without heart rate',
    );
  });
});

// ---------------------------------------------------------------------------
// 8. Mute gating
// ---------------------------------------------------------------------------

describe('mute silences the coach but never the safety net', () => {
  it('suppresses normal cues while still recording that they were owed', () => {
    state().toggleMute();
    assert.equal(state().muted, true);

    beginSession();

    assert.deepEqual(cues, [], 'nothing should reach the sink while muted');
    const played = state().telemetry.filter((e) => e.type === 'cue_played');
    assert.ok(played.length > 0, 'suppressed cues are still tracked');
    played.forEach((e) => {
      assert.equal(e.data?.suppressed, true);
    });
  });

  it('lets a critical cue through even when muted', () => {
    beginSession();
    stepTimes(3);
    state().toggleMute();
    cues = [];

    state().triggerAbort();

    const abortCue = cues.find((c) => c.id === 'abort');
    assert.ok(abortCue, 'critical cues are never suppressed');
    assert.equal(abortCue.priority, 'critical');
  });
});

// ---------------------------------------------------------------------------
// 9. Telemetry
// ---------------------------------------------------------------------------

describe('telemetry covers the whole session', () => {
  it('emits every milestone event exactly once or more, with unique ids and a sane clock', () => {
    runToPendingCut();
    state().acceptAdaptation();

    const events = state().telemetry;
    const required: TelemetryType[] = [
      'session_start',
      'set_start',
      'rep_logged',
      'rest_start',
      'rest_end',
      'adaptation_proposed',
      'session_complete',
    ];
    const seen = new Set(events.map((e) => e.type));
    required.forEach((type) => {
      assert.ok(seen.has(type), `missing telemetry event: ${type}`);
    });

    const ids = new Set(events.map((e) => e.id));
    assert.equal(ids.size, events.length, 'telemetry ids must be unique');
    events.forEach((e) => {
      assert.ok(Number.isFinite(e.sessionClock) && e.sessionClock >= 0, `bad clock on ${e.type}`);
    });
  });
});

// ---------------------------------------------------------------------------
// 10. Demo states
// ---------------------------------------------------------------------------

describe('every demo jump lands on a self-consistent state', () => {
  const targets: readonly DemoJumpTarget[] = [
    'idle',
    'set',
    'rest',
    'adapt',
    'override',
    'abort',
    'summary',
    'log',
  ];
  const routes: Record<DemoJumpTarget, DemoRoute> = {
    idle: '/',
    set: '/',
    rest: '/',
    adapt: '/',
    override: '/',
    abort: '/',
    summary: '/summary',
    log: '/log',
  };
  const phases: readonly SessionPhase[] = ['idle', 'set', 'rest', 'complete', 'aborted'];

  targets.forEach((target) => {
    it(`the '${target}' snapshot is internally honest and routes to ${routes[target]}`, () => {
      const route = state().demoJump(target);
      assert.equal(route, routes[target]);

      const s = state();
      assert.ok(phases.includes(s.phase), `invalid phase ${s.phase}`);
      assert.equal(s.sets.length, s.currentSet, 'the set log must match the set counter');
      s.sets.forEach((entry, i) => {
        assert.equal(entry.setNumber, i + 1);
        assert.ok(entry.repsCompleted <= entry.targetReps);
      });

      s.recovery.deltas.forEach((d) => {
        if (d.delta !== null) {
          assert.notEqual(d.state, 'unknown', `set ${d.setNumber} has a drop but no verdict`);
          assert.equal(d.state, classify(d.delta, true));
          assert.equal(d.hrAtRestStart - (d.hrAt60s ?? 0), d.delta);
        }
      });

      if (s.pendingAdaptation) {
        assert.ok(s.pendingAdaptation.trigger.trim().length > 0);
      }
      s.adaptations.forEach((a) => {
        assert.ok(a.trigger.trim().length > 0);
      });

      if (s.phase === 'aborted') assert.ok(s.aborted);
      if (s.phase === 'rest') assert.notEqual(s.rest.startedAtClock, null);
      if (s.phase === 'idle') {
        assert.equal(s.sets.length, 0);
        assert.equal(s.recovery.deltas.length, 0);
      }
      assert.ok(s.hr.current > 0);
      assert.ok(s.sessionClock >= 0);
      assert.ok(
        s.samples.every((sample) => Number.isFinite(sample.bpm) && sample.bpm > 0),
        'demo snapshots must carry a real HR trace',
      );
      assert.equal(state().telemetry.at(-1)?.type, 'demo_state_jump');
    });
  });

  it("the 'rest' snapshot lands before the twenty second warning, so the rig can demo it", () => {
    state().demoJump('rest');
    assert.ok(state().rest.secondsLeft > REST_WARNING_SEC, 'the rest snapshot lands pre-warning');
    assert.equal(state().rest.warned20, false);
  });
});
