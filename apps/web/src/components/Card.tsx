import type { ReactNode } from 'react';
import type { Tone } from './Icon';

export interface CardProps {
  children: ReactNode;
  /** Uppercase eyebrow rendered above the content. */
  title?: string;
  /** md 20px · sm 14px */
  pad?: 'md' | 'sm';
  /** 3px left rail grouping the card into a metric domain. */
  rail?: Tone;
  className?: string;
}

export function Card({ children, title, pad = 'md', rail, className }: CardProps) {
  const classes = [
    'cad-card',
    `cad-card--pad-${pad}`,
    rail === undefined ? '' : 'cad-card--rail',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classes} data-tone={rail}>
      {title === undefined ? null : <div className="cad-card__title">{title}</div>}
      {children}
    </section>
  );
}
