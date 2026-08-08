export type DeltaState = 'good' | 'ok' | 'poor' | 'unknown';

export interface DeltaTileProps {
  label: string;
  /** Pre-formatted, signed where a sign is meaningful. */
  value: string;
  state: DeltaState;
}

const STATE_WORD: Record<DeltaState, string> = {
  good: 'Good',
  ok: 'Ok',
  poor: 'Poor',
  /* The neutral em dash is the only unicode character the system uses. */
  unknown: '—',
};

export function DeltaTile({ label, value, state }: DeltaTileProps) {
  return (
    <div className="cad-delta">
      <span className="cad-delta__label">{label}</span>
      <div className="cad-delta__row">
        <span className="cad-delta__value">{value}</span>
        <span className={`cad-delta__state cad-delta__state--${state}`}>{STATE_WORD[state]}</span>
      </div>
    </div>
  );
}
