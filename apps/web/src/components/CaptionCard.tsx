export interface CaptionCardProps {
  /** The line the coach is saying, or the last line it said. */
  text: string;
  /** True while the coach is speaking — swaps the dot for the waveform. */
  active?: boolean;
}

export function CaptionCard({ text, active = false }: CaptionCardProps) {
  return (
    <div className="cad-caption">
      <div className="cad-caption__lead">
        {active ? (
          <>
            <span className="cad-caption__wf" />
            <span className="cad-caption__wf" />
            <span className="cad-caption__wf" />
            <span className="cad-caption__wf" />
          </>
        ) : (
          <span className="cad-caption__dot" />
        )}
      </div>
      <p className="cad-caption__text">{text}</p>
    </div>
  );
}
