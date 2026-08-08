import type { ToneOrNeutral } from './Icon';
import { Icon } from './Icon';

export interface MetricTileProps {
  label: string;
  /** Pre-formatted readout. Numerals are never spelled out. */
  value: string;
  unit?: string;
  icon?: string;
  tone?: ToneOrNeutral;
  /** One short line of context, e.g. "vs 30-day average". */
  footnote?: string;
}

export function MetricTile({
  label,
  value,
  unit,
  icon,
  tone = 'neutral',
  footnote,
}: MetricTileProps) {
  return (
    <div className="cad-metric-tile" data-tone={tone}>
      <div className="cad-metric-tile__head">
        {icon === undefined ? null : <Icon name={icon} size={14} />}
        <span className="cad-metric-tile__label">{label}</span>
      </div>
      <div className="cad-metric-tile__body">
        <span className="cad-metric-tile__value">{value}</span>
        {unit === undefined ? null : <span className="cad-metric-tile__unit">{unit}</span>}
      </div>
      {footnote === undefined ? null : (
        <span className="cad-metric-tile__footnote">{footnote}</span>
      )}
    </div>
  );
}
