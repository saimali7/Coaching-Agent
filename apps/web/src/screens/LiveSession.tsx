import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Badge,
  Button,
  CaptionCard,
  DeltaTile,
  Icon,
  Orb,
  SetPips,
  Sheet,
} from '../components';
import { useSessionStore } from '../engine/sessionStore';
import { SAFETY_CEILING_BPM } from '../engine/programme';
import { cueEngine } from '../audio/cueEngine';
import { CUE_IDS } from '../audio/cueScript';
import { useCoachAgentContext } from '../voice/CoachAgentProvider';
import { useWakeLock } from '../lib/useWakeLock';
import { clock, deltaText, zoneLabel, zoneTone } from './format';

// S1–S6 from the design: idle · set · rest · adaptation sheet · override · safety abort.
export function LiveSession() {
  const navigate = useNavigate();
  const s = useSessionStore();
  const agent = useCoachAgentContext();

  const {
    phase,
    programme,
    currentSet,
    plannedSetsDynamic,
    sets,
    rest,
    hr,
    recovery,
    pendingAdaptation,
    aborted,
    muted,
  } = s;

  const currentLog = sets[currentSet - 1];
  const reps = currentLog?.repsCompleted ?? 0;
  const target = currentLog?.targetReps ?? programme.targetReps;

  const onWakeLockUnavailable = useCallback(
    (reason: string) => useSessionStore.getState().track('wake_lock_unavailable', { reason }),
    [],
  );
  useWakeLock(phase === 'set' || phase === 'rest', onWakeLockUnavailable);

  useEffect(() => {
    if (phase === 'complete') {
      const t = setTimeout(() => void navigate({ to: '/summary' }), 1400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, navigate]);

  const orbState = useMemo(() => {
    if (phase === 'aborted') return 'alarmed' as const;
    if (agent.talkState === 'speaking') return 'speaking' as const;
    if (agent.talkState === 'listening' || agent.talkState === 'connecting')
      return 'listening' as const;
    if (phase === 'idle') return 'idle' as const;
    return 'speaking' as const;
  }, [phase, agent.talkState]);

  const caption = useMemo(() => {
    if (agent.agentLine) return agent.agentLine;
    if (pendingAdaptation) return 'Recovery is falling. Read the change and decide.';
    switch (phase) {
      case 'set':
        return reps >= target - 3 && reps > 0
          ? `${target - reps} to go. Hold the brace.`
          : `${programme.movement}, ${programme.loadKg} kilos. Tap each rep as you finish it.`;
      case 'rest':
        return currentLog?.rir === null
          ? 'How many did you have left in the tank?'
          : 'Breathe through your nose. I will call you in at twenty.';
      case 'complete':
        return 'Session complete. Pulling your summary together.';
      default:
        return `${programme.movement}. ${programme.plannedSets} sets of ${programme.targetReps} at ${programme.loadKg} kilos.`;
    }
  }, [agent.agentLine, pendingAdaptation, phase, reps, target, programme, currentLog]);

  const hero =
    phase === 'set'
      ? { value: String(reps), label: `of ${target} reps · set ${currentSet}` }
      : phase === 'rest'
        ? { value: clock(rest.secondsLeft * 1000), label: 'rest remaining' }
        : phase === 'complete'
          ? { value: String(sets.filter((x) => x.endedAt !== null).length), label: 'sets logged' }
          : null;

  const onStart = () => {
    void cueEngine.primeAudio(CUE_IDS);
    s.startSession();
  };

  if (phase === 'aborted' && aborted) {
    return <SafetyAbort hrAtAbort={aborted.hrAtAbort} setNumber={currentSet} />;
  }

  return (
    <div className="cad-screen ls">
      <header className="ls-head">
        <div className="ls-head-left">
          <div className="ls-movement">{programme.movement}</div>
          <div className="ls-plan">
            {plannedSetsDynamic} × {programme.targetReps} · {programme.loadKg} kg
          </div>
        </div>
        <div className="ls-head-right">
          <div className="ls-hr">
            <span className={hr.connected ? 'ls-heart' : 'ls-heart is-off'}>
              <Icon name="heart" size={17} color={hr.connected ? 'var(--coral-400)' : undefined} />
            </span>
            <span className="ls-hr-value">{hr.connected ? hr.current : '––'}</span>
            <span className="ls-hr-unit">BPM</span>
          </div>
          <Badge tone={hr.connected ? zoneTone(hr.zone) : 'neutral'}>
            {hr.connected ? zoneLabel(hr.zone) : 'No signal'}
          </Badge>
        </div>
      </header>

      <div className="ls-pips">
        <SetPips
          total={programme.plannedSets}
          current={currentSet}
          completedReps={sets.map((x) => x.repsCompleted / (x.targetReps || 1))}
          cutFrom={plannedSetsDynamic < programme.plannedSets ? plannedSetsDynamic : undefined}
        />
      </div>

      <div className="ls-orb">
        <Orb state={orbState} />
      </div>

      <div className="ls-hero">
        {hero ? (
          <>
            <div className="ls-hero-value">{hero.value}</div>
            <div className="ls-hero-label">{hero.label}</div>
          </>
        ) : (
          <>
            <div className="ls-hero-idle">Ready when you are</div>
            <div className="ls-hero-sub">
              Heart rate is streaming. The session runs on voice — you can put the phone down.
            </div>
          </>
        )}
      </div>

      {/* The agent's answer owns the card outright while it is set — engine copy
          returns only after the voice layer clears the line. While the answer is
          up, the waveform tracks the agent actually speaking, not the orb. */}
      <CaptionCard
        text={caption}
        active={agent.agentLine !== null ? agent.talkState === 'speaking' : orbState === 'speaking'}
      />

      <div className="ls-deltas">
        {[0, 1, 2].map((i) => {
          const d = recovery.deltas[i];
          return (
            <DeltaTile
              key={i}
              label={`REST ${i + 1}`}
              value={deltaText(d?.delta ?? null)}
              state={d?.state ?? 'unknown'}
            />
          );
        })}
      </div>

      <div className="ls-spacer" />

      {phase === 'idle' && (
        <div className="ls-actions">
          <Button size="lg" block icon="play" onClick={onStart}>
            Start training
          </Button>
          <div className="ls-source">Heart rate · demo trace</div>
        </div>
      )}

      {phase === 'set' && (
        <div className="ls-actions">
          {agent.micAlwaysOn ? (
            <div className="ls-gate">
              Coach is listening on hold — one-sentence answers mid-set
            </div>
          ) : (
            <div className="ls-gate">
              <Icon name="lock" size={14} /> Mic opens in the rest window
            </div>
          )}
          <button
            className="ls-tap"
            onClick={s.logRep}
            // A pad that keeps focus turns the next Space press into a phantom
            // rep. Blur on release so Space always belongs to the mic.
            onPointerUp={(e) => e.currentTarget.blur()}
            type="button"
          >
            <span className="ls-tap-title">Tap to log a rep</span>
            <span className="ls-tap-sub">the coach counts your last three out loud</span>
          </button>
        </div>
      )}

      {phase === 'rest' && (
        <div className="ls-rest-actions">
          <PushToTalk agent={agent} />
          <div className="ls-rest-copy">
            {/* Priority: unavailable > connecting > holding > speaking > idle. */}
            <div className="ls-rest-title">
              {agent.talkState === 'unavailable'
                ? 'Coach offline'
                : agent.talkState === 'connecting'
                  ? 'Connecting…'
                  : agent.holding
                    ? 'Listening'
                    : agent.talkState === 'speaking'
                      ? 'Coach replying'
                      : 'Hold to talk'}
            </div>
            <div className="ls-rest-sub">
              {agent.talkState === 'unavailable'
                ? 'Voice agent is not configured — Tier 0 cues carry the session.'
                : 'Hold the button, speak, let go. Space bar works too.'}
            </div>
            <div className="ls-rest-row">
              <Button variant="ghost" size="sm" onClick={s.skipRest}>
                Skip rest
              </Button>
              {currentLog?.rir === null && (
                <div className="ls-rir">
                  <span>RIR</span>
                  {[0, 1, 2, 3].map((n) => (
                    <button key={n} type="button" onClick={() => s.captureRir(n)}>
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {phase === 'complete' && (
        <div className="ls-actions">
          <Button size="lg" block iconAfter="arrow-right" onClick={() => void navigate({ to: '/summary' })}>
            See your session
          </Button>
        </div>
      )}

      {/* The mic is a permanent fixture: one bottom-anchored row, same place in
          every phase, so muscle memory holds. In rest the 76px talk button above
          owns the gesture, so the bar carries only the mute chip there — never
          two mics on one screen. */}
      <div className="ls-talkbar">
        {phase !== 'rest' && (
          <>
            <PushToTalk agent={agent} compact />
            <span
              className={`ls-talkbar-label${
                agent.holding
                  ? ' is-holding'
                  : agent.talkState === 'speaking'
                    ? ' is-replying'
                    : ''
              }`}
            >
              {agent.talkState === 'unavailable'
                ? 'Coach offline'
                : agent.talkState === 'connecting'
                  ? 'Connecting…'
                  : agent.holding
                    ? 'Listening'
                    : agent.talkState === 'speaking'
                      ? 'Coach replying'
                      : agent.canTalk
                        ? 'Hold to talk · space works too'
                        : 'Mic opens in rest'}
            </span>
          </>
        )}
        <button
          className="ls-mute"
          type="button"
          onClick={s.toggleMute}
          // The chip stays mounted across phases, so a focused chip would turn
          // the next Space hold into a phantom mute toggle. Blur on release.
          onPointerUp={(e) => e.currentTarget.blur()}
          aria-label={muted ? 'Unmute coach' : 'Mute coach'}
        >
          <Icon name={muted ? 'circle-alert' : 'zap'} size={14} />
          {muted ? 'Coach muted' : 'Coach on'}
        </button>
      </div>

      <Sheet
        open={pendingAdaptation !== null}
        icon="trending-down"
        tone="coral"
        eyebrow="Plan changed"
        title={`Cutting ${pendingAdaptation?.detail.setsCut ?? 1} set${
          (pendingAdaptation?.detail.setsCut ?? 1) > 1 ? 's' : ''
        }`}
        body={pendingAdaptation?.trigger ?? ''}
        facts={[
          { label: 'RECOVERY', value: deltaText(recovery.deltas.at(-1)?.delta ?? null) },
          { label: 'SETS LEFT', value: String(pendingAdaptation?.detail.setsCut ?? 0) },
        ]}
        actions={
          <>
            <Button size="lg" block onClick={s.acceptAdaptation}>
              Take the cut
            </Button>
            <Button variant="outline" size="md" block onClick={s.overrideAdaptation}>
              “I feel fine, let me finish”
            </Button>
            {agent.canTalk && (
              // The sheet covers the screen, so the mic has to be reachable from
              // inside it — arguing with the decision is the point (#38). Same
              // hold gesture as everywhere else; Space still works via the rest
              // button's listener underneath the scrim.
              <button
                type="button"
                className={`cad-btn cad-btn--ghost cad-btn--md cad-btn--block${
                  agent.holding ? ' is-holding' : ''
                }`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!agent.holding) void agent.holdStart();
                }}
                onPointerUp={(e) => {
                  agent.holdEnd();
                  e.currentTarget.blur();
                }}
                onPointerCancel={() => agent.holdEnd()}
                aria-pressed={agent.holding}
                aria-label={agent.holding ? 'Release to send' : 'Hold to talk it through'}
              >
                <Icon name="message-circle" size={16} className="cad-btn__icon" />
                <span className="cad-btn__label">
                  {agent.holding ? 'Listening…' : 'Hold to talk it through'}
                </span>
              </button>
            )}
          </>
        }
      />
    </div>
  );
}

type Agent = ReturnType<typeof useCoachAgentContext>;

/**
 * Hold to speak, release to send. A press-and-hold is the honest gesture here:
 * the athlete knows exactly when the coach is listening, and the agent cannot
 * pick up the gym — or the audience — between turns.
 */
function PushToTalk({ agent, compact = false }: { agent: Agent; compact?: boolean }) {
  const { canTalk, holding, holdStart, holdEnd, talkState } = agent;

  // Space holds too, so the control is not mouse-only. Enter is deliberately
  // not a hold key — it is too entangled with button and form activation to
  // borrow safely. Key repeat fires held keydown events, hence `e.repeat`.
  useEffect(() => {
    if (!canTalk) return;
    const isHoldKey = (e: KeyboardEvent) => e.code === 'Space';
    // Space on a focused control activates the control — checking only the
    // event target misses this, because activation follows the focused
    // element. Leave the key to whatever owns focus.
    const controlHasFocus = () => {
      const el = document.activeElement as HTMLElement | null;
      if (el === null) return false;
      const tag = el.tagName;
      return (
        tag === 'BUTTON' ||
        tag === 'SELECT' ||
        tag === 'A' ||
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        el.isContentEditable
      );
    };
    const down = (e: KeyboardEvent) => {
      if (!isHoldKey(e) || e.repeat || holding || controlHasFocus()) return;
      e.preventDefault();
      void holdStart();
    };
    const up = (e: KeyboardEvent) => {
      // Only a hold this listener opened gets closed here; when nothing is
      // held, Space belongs to the focused control, untouched.
      if (!isHoldKey(e) || !holding) return;
      e.preventDefault();
      holdEnd();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [canTalk, holding, holdStart, holdEnd]);

  // A pointer released outside the button, or a lost window focus, must still
  // close the mic — otherwise it stays open with nobody watching.
  useEffect(() => {
    if (!holding) return;
    const release = () => holdEnd();
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
    };
  }, [holding, holdEnd]);

  // Disabled reads as unavailable but the button never unmounts — the talkbar
  // must not jump when the rig restores the rest-only gate.
  // State priority is explicit: unavailable > connecting > holding > speaking
  // > idle. While connecting during a hold the label side says 'Connecting…'
  // but the button stays visually held (`is-holding` rides along).
  const state =
    !canTalk || talkState === 'unavailable'
      ? 'unavailable'
      : talkState === 'connecting'
        ? 'connecting'
        : holding
          ? 'holding'
          : talkState === 'speaking'
            ? 'speaking'
            : 'idle';
  const heldWhileConnecting = state === 'connecting' && holding;

  return (
    <button
      className={`ls-talk is-${state}${heldWhileConnecting ? ' is-holding' : ''}${
        compact ? ' is-compact' : ''
      }`}
      onPointerDown={(e) => {
        e.preventDefault();
        // The window-level eager-connect listener (and anything else on the
        // window) must not also see this press — the button owns it.
        e.stopPropagation();
        if (holding) return;
        void holdStart();
      }}
      // Focus left on the button would make the next Space press re-activate
      // it instead of opening the mic. Release always blurs; holdEnd itself
      // arrives via the window-level pointerup listener.
      onPointerUp={(e) => e.currentTarget.blur()}
      onPointerCancel={(e) => e.currentTarget.blur()}
      disabled={!canTalk}
      type="button"
      aria-pressed={holding}
      aria-label={
        !canTalk
          ? 'Mic opens in rest'
          : holding
            ? 'Release to send'
            : 'Hold to talk to your coach'
      }
    >
      <Icon name="message-circle" size={compact ? 20 : 28} />
    </button>
  );
}

function SafetyAbort({ hrAtAbort, setNumber }: { hrAtAbort: number; setNumber: number }) {
  const navigate = useNavigate();
  return (
    <div className="abort">
      <div className="abort-eyebrow">
        <Icon name="triangle-alert" size={22} />
        Safety ceiling
      </div>
      <h1 className="abort-title">
        Stop.
        <br />
        Rack the bar.
      </h1>
      <p className="abort-body">
        Your heart rate crossed {SAFETY_CEILING_BPM} and held. Sit down, breathe through your nose,
        and let it come back under 120 before you move.
      </p>
      <div className="abort-stats">
        <div className="abort-stat is-hot">
          <div className="abort-stat-label">CURRENT</div>
          <div className="abort-stat-value">{hrAtAbort}</div>
        </div>
        <div className="abort-stat">
          <div className="abort-stat-label">CEILING</div>
          <div className="abort-stat-value is-muted">{SAFETY_CEILING_BPM}</div>
        </div>
      </div>
      <div className="ls-spacer" />
      <p className="abort-note">
        Session ended and logged at set {setNumber}. Nothing about this was adapted — an abort is not
        a coaching decision.
      </p>
      <Button variant="danger" size="lg" block onClick={() => void navigate({ to: '/summary' })}>
        End session
      </Button>
    </div>
  );
}
