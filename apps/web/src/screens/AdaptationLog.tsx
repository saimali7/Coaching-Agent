import { useNavigate } from '@tanstack/react-router';
import { Badge, Button } from '../components';
import { useSessionStore } from '../engine/sessionStore';
import { clock } from './format';
import type { AdaptationDecision } from '../engine/types';

const DECISION_TITLE: Record<AdaptationDecision['kind'], string> = {
  cut_sets: 'Remaining sets cut',
  extend_rest: 'Rest extended silently',
  abort: 'Session aborted on safety ceiling',
};

const STATUS_TONE: Record<AdaptationDecision['status'], 'mint' | 'amber' | 'coral' | 'neutral'> = {
  accepted: 'mint',
  overridden: 'amber',
  proposed: 'coral',
  auto: 'neutral',
};

// S8 · Adaptation log — every decision, its trigger, and whether it was taken.
export function AdaptationLog() {
  const navigate = useNavigate();
  const adaptations = useSessionStore((s) => s.adaptations);
  const pending = useSessionStore((s) => s.pendingAdaptation);
  const entries = pending ? [...adaptations, pending] : adaptations;

  return (
    <div className="cad-screen log">
      <div className="log-back">
        <Button variant="ghost" size="sm" icon="chevron-left" onClick={() => void navigate({ to: '/summary' })}>
          Back
        </Button>
      </div>

      <div className="log-intro">
        <div className="log-eyebrow">Adaptation log</div>
        <p className="log-lede">
          Every decision, its trigger, and whether you took it. The rule decides; the coach only
          reports it.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="log-empty">
          <div className="log-empty-title">Nothing was adapted</div>
          <p className="log-empty-body">
            Recovery stayed above threshold for every rest, so no rule fired. That is a result, not
            an absence of one.
          </p>
        </div>
      ) : (
        entries.map((e) => (
          <article key={e.id} className={`log-entry is-${STATUS_TONE[e.status]}`}>
            <div className="log-entry-head">
              <span className="log-entry-when">
                {clock(e.at)} · Set {e.setNumber}
              </span>
              <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
            </div>
            <h2 className="log-entry-title">{DECISION_TITLE[e.kind]}</h2>
            <p className="log-entry-trigger">{e.trigger}</p>
            {e.compensation && <p className="log-entry-comp">Compensation · {e.compensation}</p>}
          </article>
        ))
      )}

      <div className="sum-foot" />
    </div>
  );
}
