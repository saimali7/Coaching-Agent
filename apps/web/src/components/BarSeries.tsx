import type { CSSProperties } from 'react';
import type { Tone } from './Icon';

export interface BarDatum {
  label: string;
  value: number;
  tone?: Tone;
}

export interface BarSeriesProps {
  data: BarDatum[];
  /** Top of the scale. Defaults to the largest value in the series. */
  max?: number;
  /** Draws the dashed reference line — a bar without a reference means nothing. */
  baselineValue?: number;
  unit?: string;
  /** Plot height in px. */
  height?: number;
}

/** Space kept above the tallest bar for its value label. */
const LABEL_BAND = 18;

export function BarSeries({ data, max, baselineValue, unit, height = 96 }: BarSeriesProps) {
  const peak = data.reduce((acc, d) => (d.value > acc ? d.value : acc), 0);
  const scale = Math.max(max ?? peak, baselineValue ?? 0, 1);
  const inner = Math.max(height - LABEL_BAND, 1);
  const toPx = (value: number) => Math.max(Math.round((value / scale) * inner), 2);

  const plotStyle = { '--bars-height': `${height}px` } as CSSProperties;

  return (
    <div className="cad-bars">
      <div className="cad-bars__plot" style={plotStyle}>
        {baselineValue === undefined ? null : (
          <div className="cad-bars__baseline" style={{ bottom: `${toPx(baselineValue)}px` }}>
            <span className="cad-bars__baseline-label">
              {baselineValue}
              {unit === undefined ? '' : ` ${unit}`}
            </span>
          </div>
        )}
        {data.map((d) => (
          <div className="cad-bars__col" key={d.label}>
            <span className="cad-bars__value">
              {d.value}
              {unit === undefined ? null : <span className="cad-bars__unit">{unit}</span>}
            </span>
            <div
              className="cad-bars__bar"
              data-tone={d.tone ?? 'mint'}
              style={{ height: `${toPx(d.value)}px` }}
            />
          </div>
        ))}
      </div>
      <div className="cad-bars__labels">
        {data.map((d) => (
          <span className="cad-bars__label" key={d.label}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
