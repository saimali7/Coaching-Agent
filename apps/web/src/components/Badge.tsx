import type { ReactNode } from 'react';
import type { ToneOrNeutral } from './Icon';

export type BadgeTone = ToneOrNeutral;

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span className="cad-badge" data-tone={tone}>
      {children}
    </span>
  );
}
