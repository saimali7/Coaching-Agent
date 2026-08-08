export interface StatRowProps {
  label: string;
  /** Pre-formatted, always carrying its unit. */
  value: string;
}

export function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="cad-statrow">
      <span className="cad-statrow__label">{label}</span>
      <span className="cad-statrow__value">{value}</span>
    </div>
  );
}
