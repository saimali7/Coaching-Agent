import { useEffect, useMemo } from 'react';
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
import { useCoachAgent } from '../voice/useCoachAgent';
import { clock, deltaText, zoneLabel, zoneTone } from './format';

// S1–S6 from the design: idle · set · rest · adaptation sheet · override · safety abort.
export function LiveSession() {
  const navigate = useNavigate();
  const s = useSessionStore();
  const agent = useCoachAgent();

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

      <CaptionCard text={caption} active={orbState === 'speaking'} />

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
          <div className="ls-gate">
            <Icon name="lock" size={14} /> Mic opens in the rest window
          </div>
          <button className="ls-tap" onClick={s.logRep} type="button">
            <span className="ls-tap-title">Tap to log a rep</span>
            <span className="ls-tap-sub">the coach counts your last three out loud</span>
          </button>
        </div>
      )}

      {phase === 'rest' && (
        <div className="ls-rest-actions">
          <button
            className={`ls-talk is-${agent.talkState}`}
            onClick={agent.talkState === 'idle' ? agent.startTalk : agent.stopTalk}
            disabled={!agent.canTalk}
            type="button"
            aria-label={agent.connected ? 'End talking to your coach' : 'Talk to your coach'}
          >
            <Icon name="message-circle" size={28} />
          </button>
          <div className="ls-rest-copy">
            <div className="ls-rest-title">
              {agent.talkState === 'unavailable'
                ? 'Coach offline'
                : agent.connected
                  ? 'Listening'
                  : 'Talk to your coach'}
            </div>
            <div className="ls-rest-sub">
              {agent.talkState === 'unavailable'
                ? 'Voice agent is not configured — Tier 0 cues carry the session.'
                : 'Ask anything until the timer hits zero.'}
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

      <button
        className="ls-mute"
        type="button"
        onClick={s.toggleMute}
        aria-label={muted ? 'Unmute coach' : 'Mute coach'}
      >
        <Icon name={muted ? 'circle-alert' : 'zap'} size={14} />
        {muted ? 'Coach muted' : 'Coach on'}
      </button>

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
              // inside it — arguing with the decision is the point (#38).
              <Button
                variant="ghost"
                size="md"
                block
                icon="message-circle"
                onClick={agent.connected ? agent.stopTalk : agent.startTalk}
              >
                {agent.connected ? 'Stop talking' : 'Talk it through'}
              </Button>
            )}
          </>
        }
      />
    </div>
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
