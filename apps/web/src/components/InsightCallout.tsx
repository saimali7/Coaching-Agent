import type { Tone } from './Icon';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';

export interface InsightCalloutProps {
  icon?: string;
  title: string;
  body: string;
  tone?: Tone;
  actionLabel?: string;
  onAction?: () => void;
}

/** Every number in this product needs a sentence explaining it. */
export function InsightCallout({
  icon = 'zap',
  title,
  body,
  tone = 'mint',
  actionLabel,
  onAction,
}: InsightCalloutProps) {
  return (
    <Card rail={tone} className="cad-insight">
      <div className="cad-insight__head" data-tone={tone}>
        <Icon name={icon} size={20} className="cad-insight__icon" />
        <h3 className="cad-insight__title">{title}</h3>
      </div>
      <p className="cad-insight__body">{body}</p>
      {actionLabel === undefined ? null : (
        <div className="cad-insight__action">
          <Button variant="ghost" size="sm" iconAfter="arrow-right" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </Card>
  );
}
