import { useNavigate } from '@tanstack/react-router';
import { Button } from '../components';
import { useSessionStore } from '../engine/sessionStore';
import { clock } from '../screens/format';
import { VoicePicker } from './VoicePicker';
import type { DemoJumpTarget, DemoSpeed } from '../engine/types';

const SPEEDS: DemoSpeed[] = [1, 4, 12];

const JUMPS: { target: DemoJumpTarget; label: string }[] = [
  { target: 'idle', label: 'Idle' },
  { target: 'set', label: 'Set' },
  { target: 'rest', label: 'Rest' },
  { target: 'adapt', label: 'Adapt' },
  { target: 'override', label: 'Override' },
  { target: 'abort', label: 'Abort' },
  { target: 'summary', label: 'Summary' },
  { target: 'log', label: 'Log' },
];

// S9 · Presenter rig. Not part of the product — it exists so the demo never
// depends on the presenter's pulse or on 14 minutes of stage time.
export function DemoRig() {
  const navigate = useNavigate();
  const s = useSessionStore();

  const jump = (target: DemoJumpTarget) => {
    const route = s.demoJump(target);
    void navigate({ to: route });
  };

  const stats: { label: string; value: string }[] = [
    { label: 'Phase', value: s.phase },
    { label: 'Heart rate', value: s.hr.connected ? `${s.hr.current} bpm · Z${s.hr.zone}` : 'no signal' },
    { label: 'Recovery', value: s.recovery.rolling },
    {
      label: 'Rule',
      value: s.pendingAdaptation
        ? 'cut proposed'
        : s.adaptations.some((a) => a.kind === 'cut_sets')
          ? 'cut resolved'
          : 'armed',
    },
    { label: 'RIR', value: String(s.sets.at(-1)?.rir ?? '—') },
    { label: 'Clock', value: clock(s.sessionClock) },
    { label: 'Events', value: String(s.telemetry.length) },
  ];

  return (
    <aside className="rig">
      <div>
        <div className="rig-eyebrow">Demo rig</div>
        <p className="rig-lede">
          Not part of the product. Jump straight to any state, or let the session run.
        </p>
      </div>

      <div className="rig-group">
        <div className="rig-label">Clock</div>
        <div className="rig-speeds">
          {SPEEDS.map((sp) => (
            <button
              key={sp}
              type="button"
              className={s.speed === sp ? 'rig-speed is-on' : 'rig-speed'}
              onClick={() => s.setSpeed(sp)}
            >
              {sp}×
            </button>
          ))}
        </div>
      </div>

      <div className="rig-group">
        <div className="rig-label">Jump to state</div>
        <div className="rig-jumps">
          {JUMPS.map((j) => (
            <button key={j.target} type="button" className="rig-jump" onClick={() => jump(j.target)}>
              {j.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rig-group">
        <div className="rig-label">Trace</div>
        <Button variant="outline" size="sm" block icon="triangle-alert" onClick={s.breachCeiling}>
          Breach the ceiling
        </Button>
        <Button variant="ghost" size="sm" block icon="circle-alert" onClick={s.dropStrap}>
          Drop the strap
        </Button>
      </div>

      <VoicePicker />

      <div className="rig-stats">
        {stats.map((r) => (
          <div key={r.label} className="rig-stat">
            <span>{r.label}</span>
            <span className="rig-stat-value">{r.value}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
