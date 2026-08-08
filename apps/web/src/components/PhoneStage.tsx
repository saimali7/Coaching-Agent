import type { ReactNode } from 'react';
import { IOSFrame } from './IOSFrame';

export interface PhoneStageProps {
  children: ReactNode;
  /** Desktop-only aside. Hidden below 1100px; never part of the product. */
  rig?: ReactNode;
}

/**
 * Desktop: the phone sits on a sunken stage with one soft mint bloom behind it.
 * Below 1100px the frame flattens to full-bleed via CSS only — the children are
 * mounted exactly once either way.
 */
export function PhoneStage({ children, rig }: PhoneStageProps) {
  return (
    <div className="cad-stage">
      <div className="cad-stage__bloom" aria-hidden={true} />
      <div className="cad-stage__inner">
        <IOSFrame>{children}</IOSFrame>
        {rig === undefined ? null : <aside className="cad-stage__rig">{rig}</aside>}
      </div>
    </div>
  );
}
