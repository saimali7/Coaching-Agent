import { useEffect } from 'react';

// A browser tab loses audio when the phone locks, so the brief's "screen locked"
// playback (#14) is not achievable on this target. Holding a screen wake lock for
// the duration of a session is the honest mitigation: the phone stays awake in a
// pocket, and the athlete still never has to touch it.
export function useWakeLock(active: boolean, onUnavailable?: (reason: string) => void): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) {
      if (active) onUnavailable?.('unsupported');
      return;
    }

    let sentinel: WakeLockSentinel | null = null;
    let released = false;

    const acquire = async () => {
      if (released || document.visibilityState !== 'visible') return;
      try {
        sentinel = await navigator.wakeLock.request('screen');
      } catch (err) {
        onUnavailable?.(err instanceof Error ? err.name : 'denied');
      }
    };

    // The lock is dropped whenever the tab is hidden; take it back on return.
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && sentinel === null) void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release().catch(() => undefined);
      sentinel = null;
    };
  }, [active, onUnavailable]);
}
