import { useEffect } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import type { Tone } from './Icon';
import { Icon } from './Icon';

export interface SheetFact {
  label: string;
  value: string;
}

export interface SheetProps {
  open: boolean;
  onClose?: () => void;
  icon?: string;
  tone?: Tone;
  eyebrow?: string;
  title: string;
  body?: string;
  facts?: SheetFact[];
  children?: ReactNode;
  actions?: ReactNode;
}

/**
 * Bottom sheet. Positioned absolutely inside its nearest positioned ancestor —
 * the phone screen — so it never escapes the device frame.
 */
export function Sheet({
  open,
  onClose,
  icon,
  tone = 'mint',
  eyebrow,
  title,
  body,
  facts,
  children,
  actions,
}: SheetProps) {
  useEffect(() => {
    if (!open || onClose === undefined) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleScrim = () => {
    if (onClose !== undefined) onClose();
  };

  const stop = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="cad-sheet" data-tone={tone} onClick={handleScrim} role="presentation">
      <div
        className="cad-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={stop}
      >
        {icon === undefined && eyebrow === undefined ? null : (
          <div className="cad-sheet__head">
            {icon === undefined ? null : <Icon name={icon} size={18} />}
            {eyebrow === undefined ? null : (
              <span className="cad-sheet__eyebrow">{eyebrow}</span>
            )}
          </div>
        )}
        <h2 className="cad-sheet__title">{title}</h2>
        {body === undefined ? null : <p className="cad-sheet__body">{body}</p>}
        {facts === undefined || facts.length === 0 ? null : (
          <div className="cad-sheet__facts">
            {facts.map((fact) => (
              <div className="cad-sheet__fact" key={fact.label}>
                <div className="cad-sheet__fact-label">{fact.label}</div>
                <div className="cad-sheet__fact-value">{fact.value}</div>
              </div>
            ))}
          </div>
        )}
        {children}
        {actions === undefined ? null : <div className="cad-sheet__actions">{actions}</div>}
      </div>
    </div>
  );
}
