export interface SetPipsProps {
  /** Planned number of sets. */
  total: number;
  /** Zero-based index of the set in progress. */
  current: number;
  /**
   * Per-set completion, indexed by set. Accepts a percentage (0–100) or a
   * fraction (0–1); the caller owns the reps/target arithmetic.
   */
  completedReps: number[];
  /** Sets from this index on were cut by an adaptation. */
  cutFrom?: number;
}

function toPercent(raw: number | undefined): number {
  if (raw === undefined || Number.isNaN(raw)) return 0;
  const pct = raw > 0 && raw <= 1 ? raw * 100 : raw;
  return Math.min(Math.max(pct, 0), 100);
}

export function SetPips({ total, current, completedReps, cutFrom }: SetPipsProps) {
  const sets = Array.from({ length: Math.max(total, 0) }, (_, i) => i);

  return (
    <div className="cad-pips">
      {sets.map((index) => {
        const cut = cutFrom !== undefined && index >= cutFrom;
        const fill = index < current ? 100 : index === current ? toPercent(completedReps[index]) : 0;
        const className = [
          'cad-pips__col',
          index === current ? 'cad-pips__col--current' : '',
          cut ? 'cad-pips__col--cut' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div className={className} key={index}>
            <div className="cad-pips__track">
              <div className="cad-pips__fill" style={{ width: `${cut ? 0 : fill}%` }} />
            </div>
            <span className="cad-pips__label">{`S${index + 1}`}</span>
          </div>
        );
      })}
    </div>
  );
}
