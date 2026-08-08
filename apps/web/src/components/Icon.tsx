import type { CSSProperties } from 'react';

/** Metric hues. Hue is a category, never a sentiment. */
export type Tone = 'mint' | 'amber' | 'coral' | 'sky';

/** Tones that also accept the un-hued default. */
export type ToneOrNeutral = Tone | 'neutral';

export interface IconProps {
  /** File name (without extension) of a glyph in /public/icons. */
  name: string;
  /** Square size in px. */
  size?: number;
  /** Explicit paint colour. Defaults to currentColor. */
  color?: string;
  /** When present the icon is exposed to assistive tech with this label. */
  label?: string;
  className?: string;
}

/**
 * Paints a Lucide SVG as a CSS mask so it inherits `currentColor` and can be
 * tinted with any metric hue.
 */
export function Icon({ name, size = 20, color, label, className }: IconProps) {
  const style = {
    '--icon-src': `url(/icons/${name}.svg)`,
    '--icon-size': `${size}px`,
    width: `${size}px`,
    height: `${size}px`,
    ...(color === undefined ? null : { backgroundColor: color }),
  } as CSSProperties;

  return (
    <span
      className={className === undefined ? 'cad-icon' : `cad-icon ${className}`}
      style={style}
      role={label === undefined ? undefined : 'img'}
      aria-label={label}
      aria-hidden={label === undefined ? true : undefined}
    />
  );
}
