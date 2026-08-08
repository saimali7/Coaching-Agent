import type { ReactNode } from 'react';
import { Icon } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  /** sm 32px · md 44px · lg 52px */
  size?: ButtonSize;
  /** Glyph name rendered before the label. */
  icon?: string;
  /** Glyph name rendered after the label. */
  iconAfter?: string;
  /** Stretch to the full width of the parent. */
  block?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  type?: 'button';
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconAfter,
  block = false,
  disabled = false,
  onClick,
  children,
  type = 'button',
}: ButtonProps) {
  const glyphSize = size === 'sm' ? 14 : 16;
  const className = [
    'cad-btn',
    `cad-btn--${variant}`,
    `cad-btn--${size}`,
    block ? 'cad-btn--block' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={className} disabled={disabled} onClick={onClick}>
      {icon === undefined ? null : <Icon name={icon} size={glyphSize} className="cad-btn__icon" />}
      <span className="cad-btn__label">{children}</span>
      {iconAfter === undefined ? null : (
        <Icon name={iconAfter} size={glyphSize} className="cad-btn__icon" />
      )}
    </button>
  );
}
