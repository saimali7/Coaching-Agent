import { useNavigate } from '@tanstack/react-router';
import { BarSeries, Button, Card, InsightCallout, MetricTile, StatRow } from '../components';
import { useSessionStore } from '../engine/sessionStore';
import { clock, deltaText, recoveryHue, recoveryTone } from './format';

// S7 · Session summary — the auditable close (#40, #41, #43, #44).
export function Summary() {
  const navigate = useNavigate();
  const s = useSessionStore();
  const summary = s.getSummary();
  const deltas = s.recovery.deltas.filter((d) => d.delta !== null);
  const lastDelta = deltas.at(-1) ?? null;
  const cut = s.adaptations.find((a) => a.kind === 'cut_sets');

  const telemetryCount = (type: string) => s.telemetry.filter((e) => e.type === type).length;
  const cueLatencies = s.telemetry
    .filter((e) => e.type === 'cue_latency')
    .map((e) => Number(e.data?.ms ?? 0))
    .filter((n) => n > 0);
  const medianLatency = cueLatencies.length
    ? Math.round([...cueLatencies].sort((a, b) => a - b)[Math.floor(cueLatencies.length / 2)] ?? 0)
    : null;

  return (
    <div className="cad-screen sum">
      <header className="sum-head">
        <div>
          <div className="sum-eyebrow">
            {s.phase === 'aborted' ? 'Session aborted' : 'Session complete'} ·{' '}
            {clock(summary.durationMs)}
          </div>
          <h1 className="sum-title">{s.programme.movement}</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            s.resetSession();
            void navigate({ to: '/' });
          }}
        >
          Done
        </Button>
      </header>

      <div className="sum-tiles">
        <MetricTile
          label="Volume"
          value={String(summary.volumeKg)}
          unit="kg"
          icon="dumbbell"
          tone="amber"
        />
        <MetricTile label="Avg HR" value={String(summary.avgHr)} unit="bpm" icon="heart" tone="sky" />
        <MetricTile
          label="Sets"
          value={`${summary.setsCompleted} of ${summary.setsPlanned}`}
          icon="target"
          tone="mint"
        />
        <MetricTile
          label="Last recovery"
          value={deltaText(lastDelta?.delta ?? null)}
          unit="bpm"
          icon="trending-down"
          tone={recoveryTone(lastDelta?.state ?? 'unknown')}
          footnote={lastDelta ? `${lastDelta.state} · first 60 s of rest` : 'no rest recorded'}
        />
      </div>

      <Card title="Recovery across rests">
        <p className="sum-note">
          Beats dropped in the first 60 seconds of each rest. Dashed line is your 30-day average.
        </p>
        <BarSeries
          data={deltas.map((d) => ({
            label: `R${d.setNumber}`,
            value: Math.abs(d.delta ?? 0),
            tone: recoveryHue(d.state),
          }))}
          max={30}
          baselineValue={15}
          unit="bpm"
        />
      </Card>

      <InsightCallout
        tone={cut ? 'coral' : 'mint'}
        icon={cut ? 'trending-down' : 'circle-check'}
        title={
          cut
            ? cut.status === 'overridden'
              ? 'You overrode the cut'
              : 'The session cut itself short'
            : 'You held recovery all session'
        }
        body={
          cut
            ? `${cut.trigger} ${
                cut.status === 'overridden'
                  ? `You finished anyway — compensation: ${cut.compensation}.`
                  : 'Remaining work was removed while you were still able to make the decision.'
              }`
            : 'Every rest cleared the recovery threshold, so the plan ran exactly as written.'
        }
        actionLabel="Open the log"
        onAction={() => void navigate({ to: '/log' })}
      />

      <Card title="Instrumentation">
        <StatRow label="Screen unlocks" value={String(telemetryCount('screen_unlock'))} />
        <StatRow label="Cues played" value={String(telemetryCount('cue_played'))} />
        <StatRow
          label="Median cue latency"
          value={medianLatency === null ? 'not measured' : `${medianLatency} ms`}
        />
        <StatRow label="Mute changes" value={String(telemetryCount('mute_change'))} />
        <StatRow
          label="Adaptations accepted / overridden"
          value={`${telemetryCount('adaptation_accepted')} / ${telemetryCount('adaptation_overridden')}`}
        />
        <StatRow label="Events captured" value={String(s.telemetry.length)} />
      </Card>

      <div className="sum-foot" />
    </div>
  );
}
