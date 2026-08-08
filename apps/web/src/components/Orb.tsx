import type { CSSProperties } from 'react';

export type OrbState = 'idle' | 'speaking' | 'listening' | 'alarmed';

export interface OrbProps {
  state: OrbState;
  /** Outer diameter in px. Ring insets and the core scale with it. */
  size?: number;
}

export function Orb({ state, size = 128 }: OrbProps) {
  const style = { '--orb-size': `${size}px` } as CSSProperties;

  return (
    <div className={`cad-orb cad-orb--${state}`} style={style} aria-hidden={true}>
      <div className="cad-orb__ring" />
      <div className="cad-orb__ring-inner" />
      {state === 'speaking' ? (
        <>
          <div className="cad-orb__emit" />
          <div className="cad-orb__emit cad-orb__emit--delayed" />
        </>
      ) : null}
      {state === 'listening' ? <div className="cad-orb__listen" /> : null}
      <div className="cad-orb__core">
        {state === 'listening' ? null : <div className="cad-orb__overlay" />}
      </div>
    </div>
  );
}
