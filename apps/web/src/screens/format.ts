import type { RecoveryState } from '../engine/types';

export const clock = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export const zoneLabel = (zone: number) => (zone > 0 ? `Zone ${zone}` : 'No zone');

export const zoneTone = (zone: number): 'mint' | 'amber' | 'coral' | 'sky' | 'neutral' => {
  if (zone >= 5) return 'coral';
  if (zone === 4) return 'amber';
  if (zone === 3) return 'mint';
  if (zone > 0) return 'sky';
  return 'neutral';
};

export const recoveryTone = (state: RecoveryState): 'mint' | 'amber' | 'coral' | 'neutral' => {
  if (state === 'good') return 'mint';
  if (state === 'ok') return 'amber';
  if (state === 'poor') return 'coral';
  return 'neutral';
};

/** Bars always carry a hue — an unmeasured recovery falls back to the brand signal. */
export const recoveryHue = (state: RecoveryState): 'mint' | 'amber' | 'coral' => {
  const tone = recoveryTone(state);
  return tone === 'neutral' ? 'mint' : tone;
};

export const deltaText = (delta: number | null) => (delta === null ? '—' : `−${Math.abs(delta)}`);
