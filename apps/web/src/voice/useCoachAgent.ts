import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useConversation } from '@elevenlabs/react';
import { useSessionStore, buildCoachContext, setRestSinks } from '../engine/sessionStore';
import type { SessionState } from '../engine/sessionStore';
import { cueEngine } from '../audio/cueEngine';
import { toDynamicVariables, toContextualUpdate, toLiveUpdate } from './context';

export type TalkState = 'unavailable' | 'idle' | 'connecting' | 'listening' | 'speaking';

// The always-live companion. The socket comes up on the first user gesture and
// stays up for the whole session: push to talk in every phase, a continuous
// context stream (event-driven + heartbeat), auto-reconnect with backoff, and
// voice performance logging. When the rig flips `micAlwaysOn` off, the old
// rest-only product rules (#31–#34, #39) bind again: hard gate outside REST,
// rest-exit endSession, gate-blocked telemetry.

/** Debounce for event-driven live updates so bursts coalesce into one send. */
const LIVE_DEBOUNCE_MS = 300;
/** Heartbeat cadence while connected in 'set' or 'rest'. */
const HEARTBEAT_MS = 5_000;
/** Heartbeat is skipped when HR moved less than this and phase/reps held. */
const HEARTBEAT_HR_DELTA = 3;
/** Reconnect backoff: 2 s doubling to a 30 s cap, reset on successful connect. */
const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 30_000;

/** Seconds into the current working set; 0 outside one. */
function setElapsedSec(s: SessionState): number {
  if (s.phase !== 'set') return 0;
  const current = s.sets.at(-1);
  if (!current) return 0;
  return Math.max(0, Math.round((s.sessionClock - current.startedAt) / 1000));
}

export function useCoachAgent() {
  const phase = useSessionStore((s) => s.phase);
  const micAlwaysOn = useSessionStore((s) => s.micAlwaysOn);
  const [agentLine, setAgentLine] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  // Push to talk: the socket stays open between turns and the microphone is
  // what opens and closes. Reconnecting per press would cost a second of
  // handshake every time and lose the conversation's memory of the last turn.
  const [holding, setHolding] = useState(false);

  const voiceStatus = useQuery({
    queryKey: ['voice-status'],
    queryFn: async () => {
      const res = await fetch('/api/voice/status');
      if (!res.ok) throw new Error('voice status unreachable');
      return (await res.json()) as { configured: boolean; agentId: string | null };
    },
    staleTime: 60_000,
    retry: 1,
  });
  const configured = voiceStatus.data?.configured ?? false;

  // Refs so callbacks and timers always see current truth without re-binding.
  const connectingRef = useRef(false);
  const configuredRef = useRef(configured);
  configuredRef.current = configured;
  const everConnectedRef = useRef(false);
  const manualStopRef = useRef(false);
  const backoffRef = useRef(RECONNECT_BASE_MS);
  const attemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Signature of the last live send, so idle heartbeats are skipped. */
  const lastSentRef = useRef<{ phase: string; reps: number; hr: number } | null>(null);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      setConnecting(false);
      connectingRef.current = false;
      everConnectedRef.current = true;
      backoffRef.current = RECONNECT_BASE_MS;
      attemptRef.current = 0;
      clearReconnectTimer();
      useSessionStore.getState().track('agent_connect');
    },
    onDisconnect: () => {
      setConnecting(false);
      connectingRef.current = false;
      const s = useSessionStore.getState();
      s.setAgentActive(false);
      s.track('agent_disconnect');
      cueEngine.setDucked(false);
      setAgentLine(null);
      maybeScheduleReconnect();
    },
    onError: (message) => {
      // Socket-drop fallback (#39): Tier 0 keeps running, the agent goes quiet —
      // and, in always-live mode, quietly tries to come back.
      setConnecting(false);
      connectingRef.current = false;
      const s = useSessionStore.getState();
      s.setAgentActive(false);
      s.track('agent_disconnect', { error: message });
      cueEngine.setDucked(false);
      maybeScheduleReconnect();
    },
    onMessage: ({ message, source }) => {
      if (source === 'ai') setAgentLine(message);
    },
    clientTools: {
      log_rep: ({ count }: { count?: number }) => {
        const s = useSessionStore.getState();
        if (s.phase !== 'set') return 'not in a working set';
        const n = Math.min(12, Math.max(1, Math.round(count ?? 1)));
        // logRep() itself no-ops once the set ends mid-batch, so over-counting
        // by voice can never spill reps into the next set.
        for (let i = 0; i < n; i++) useSessionStore.getState().logRep();
        useSessionStore.getState().track('voice_rep_logged', { count: n });
        return 'logged';
      },
      log_rir: ({ rir }: { rir: number }) => {
        useSessionStore.getState().captureRir(Math.round(rir));
        return 'logged';
      },
      extend_rest: ({ seconds }: { seconds: number }) => {
        useSessionStore.getState().extendRest(Math.min(120, Math.max(10, Math.round(seconds))));
        return 'extended';
      },
      skip_rest: () => {
        useSessionStore.getState().skipRest();
        return 'skipped';
      },
      accept_adaptation: () => {
        useSessionStore.getState().acceptAdaptation();
        return 'accepted';
      },
      override_adaptation: () => {
        useSessionStore.getState().overrideAdaptation();
        return 'overridden';
      },
      end_session: () => {
        useSessionStore.getState().completeSession();
        return 'ended';
      },
    },
  });

  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;

  /** Open the socket if needed. The mic starts muted — holding is what opens it. */
  const connect = useCallback(async (): Promise<boolean> => {
    const c = conversationRef.current;
    if (c.status === 'connected') return true;
    if (connectingRef.current) return false;
    manualStopRef.current = false;
    connectingRef.current = true;
    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const res = await fetch('/api/voice/signed-url');
      if (!res.ok) throw new Error('signed url unavailable');
      const { signedUrl } = (await res.json()) as { signedUrl: string };
      const st = useSessionStore.getState();
      conversationRef.current.startSession({
        signedUrl,
        connectionType: 'websocket',
        dynamicVariables: toDynamicVariables(buildCoachContext(st), {
          sessionClockMs: st.sessionClock,
          setElapsedSeconds: setElapsedSec(st),
        }),
      });
      return true;
    } catch {
      setConnecting(false);
      connectingRef.current = false;
      useSessionStore.getState().track('agent_disconnect', { error: 'start_failed' });
      return false;
    }
  }, []);

  /**
   * Auto-reconnect (always-live only). Backoff doubles from 2 s to a 30 s cap
   * and resets on a successful connect. Never loops when unconfigured: it arms
   * only after a successful connect or a positive /api/voice/status. A manual
   * stopTalk() marks the disconnect as intentional and suppresses it.
   */
  const maybeScheduleReconnect = useCallback(() => {
    if (manualStopRef.current) return;
    if (!useSessionStore.getState().micAlwaysOn) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    if (!everConnectedRef.current && !configuredRef.current) return;
    if (reconnectTimerRef.current !== null) return;

    const delay = backoffRef.current;
    backoffRef.current = Math.min(RECONNECT_MAX_MS, backoffRef.current * 2);
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      const s = useSessionStore.getState();
      // The rig may have restored rest-only mode while the timer was pending.
      if (!s.micAlwaysOn && s.phase !== 'rest') return;
      attemptRef.current += 1;
      s.track('agent_reconnect', { attempt: attemptRef.current });
      void connect().then((ok) => {
        if (!ok && conversationRef.current.status !== 'connected') maybeScheduleReconnect();
      });
    }, delay);
  }, [connect]);

  // Eager connection: browsers require a user gesture before getUserMedia, so
  // the first pointerdown anywhere brings the socket up (mic muted). A failed
  // attempt re-arms on the next gesture.
  useEffect(() => {
    if (!configured) return;
    let disposed = false;
    const onPointerDown = () => {
      window.removeEventListener('pointerdown', onPointerDown);
      if (conversationRef.current.status === 'connected' || connectingRef.current) return;
      void connect().then((ok) => {
        if (!ok && !disposed && conversationRef.current.status !== 'connected') {
          window.addEventListener('pointerdown', onPointerDown);
        }
      });
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      disposed = true;
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [configured, connect]);

  // #33 / #34 — engine sinks. Registered once; refs keep them fresh.
  useEffect(() => {
    setRestSinks({
      onRestEnter: (ctx) => {
        const c = conversationRef.current;
        if (c.status === 'connected') c.sendContextualUpdate(toContextualUpdate(ctx));
      },
      onRestExit: () => {
        if (useSessionStore.getState().micAlwaysOn) return;
        const c = conversationRef.current;
        if (c.status === 'connected' || c.status === 'connecting') {
          manualStopRef.current = true;
          c.endSession();
        }
      },
    });
    return () => setRestSinks(null);
  }, []);

  // Defensive hard gate (#32): whatever moved the machine out of REST —
  // demo jumps included — the agent is cut off. Always-live mode lifts this;
  // when the rig restores rest-only, the full gate binds again.
  useEffect(() => {
    if (micAlwaysOn) return;
    const c = conversationRef.current;
    if (phase !== 'rest' && (c.status === 'connected' || connecting)) {
      manualStopRef.current = true;
      clearReconnectTimer();
      c.endSession();
      setConnecting(false);
      setHolding(false);
      useSessionStore.getState().track('agent_gate_blocked', { phase });
    }
  }, [phase, connecting, micAlwaysOn, clearReconnectTimer]);

  /** Send one compact live line; also records the signature heartbeats compare against. */
  const sendLiveUpdate = useCallback(() => {
    const c = conversationRef.current;
    if (c.status !== 'connected') return;
    const s = useSessionStore.getState();
    lastSentRef.current = {
      phase: s.phase,
      reps: s.sets.at(-1)?.repsCompleted ?? 0,
      hr: s.hr.current,
    };
    c.sendContextualUpdate(
      toLiveUpdate(buildCoachContext(s), {
        sessionClockMs: s.sessionClock,
        setElapsedSeconds: setElapsedSec(s),
      }),
    );
  }, []);

  // Live context stream, event-driven: phase, set number, reps, adaptation
  // presence, last RIR. Debounced so a burst (rep + set end + rest entry)
  // coalesces into a single update.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const signature = (s: SessionState) => ({
      phase: s.phase,
      currentSet: s.currentSet,
      reps: s.sets.at(-1)?.repsCompleted ?? 0,
      pending: s.pendingAdaptation !== null,
      rir: s.sets.at(-1)?.rir ?? null,
    });
    let prev = signature(useSessionStore.getState());
    const unsubscribe = useSessionStore.subscribe((state) => {
      const next = signature(state);
      if (
        next.phase === prev.phase &&
        next.currentSet === prev.currentSet &&
        next.reps === prev.reps &&
        next.pending === prev.pending &&
        next.rir === prev.rir
      ) {
        return;
      }
      prev = next;
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        sendLiveUpdate();
      }, LIVE_DEBOUNCE_MS);
    });
    return () => {
      unsubscribe();
      if (timer !== null) clearTimeout(timer);
    };
  }, [sendLiveUpdate]);

  // Heartbeat: every ~5 s while connected in 'set' or 'rest', carrying HR,
  // rest seconds left / set elapsed and the session clock — skipped when
  // nothing meaningful moved since the last send (HR within ±3 bpm, same
  // phase and reps) so the agent is not spammed.
  useEffect(() => {
    if (conversation.status !== 'connected') return;
    const id = setInterval(() => {
      const s = useSessionStore.getState();
      if (s.phase !== 'set' && s.phase !== 'rest') return;
      const last = lastSentRef.current;
      if (
        last &&
        last.phase === s.phase &&
        last.reps === (s.sets.at(-1)?.repsCompleted ?? 0) &&
        Math.abs(last.hr - s.hr.current) <= HEARTBEAT_HR_DELTA
      ) {
        return;
      }
      sendLiveUpdate();
    }, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [conversation.status, sendLiveUpdate]);

  // Ducking follows speech, not connection: an always-live socket must not
  // permanently duck Tier-0 cues. The orb mirrors the same signal.
  useEffect(() => {
    const speaking = conversation.status === 'connected' && conversation.isSpeaking;
    cueEngine.setDucked(speaking);
    useSessionStore.getState().setAgentActive(speaking);
  }, [conversation.status, conversation.isSpeaking]);

  const startTalk = useCallback(async () => {
    const s = useSessionStore.getState();
    if (s.phase !== 'rest' && !s.micAlwaysOn) {
      s.track('agent_gate_blocked', { phase: s.phase, reason: 'start_outside_rest' });
      return;
    }
    await connect();
  }, [connect]);

  const stopTalk = useCallback(() => {
    manualStopRef.current = true;
    clearReconnectTimer();
    conversationRef.current.endSession();
    setConnecting(false);
    connectingRef.current = false;
    setHolding(false);
  }, [clearReconnectTimer]);

  // --- push to talk ---------------------------------------------------------
  const holdStart = useCallback(async () => {
    const s = useSessionStore.getState();
    if (s.phase !== 'rest' && !s.micAlwaysOn) {
      s.track('agent_gate_blocked', { phase: s.phase, reason: 'hold_outside_rest' });
      return;
    }
    setHolding(true);
    const ready = await connect();
    if (!ready && conversationRef.current.status !== 'connected') return;
    conversationRef.current.setMuted(false);
  }, [connect]);

  const holdEnd = useCallback(() => {
    setHolding(false);
    // Closing the mic is what ends the turn; the socket stays open so the
    // agent can answer and remember the exchange.
    if (conversationRef.current.status === 'connected') conversationRef.current.setMuted(true);
  }, []);

  // The mic must be shut the instant a connection lands while nothing is held,
  // otherwise the first press leaves it open and the agent hears the whole room.
  useEffect(() => {
    if (conversation.status !== 'connected') return;
    conversationRef.current.setMuted(!holding);
  }, [conversation.status, holding]);

  // Unmount: no pending reconnect may outlive the hook, and ducking is restored.
  useEffect(() => {
    return () => {
      clearReconnectTimer();
      cueEngine.setDucked(false);
      useSessionStore.getState().setAgentActive(false);
    };
  }, [clearReconnectTimer]);

  const talkState: TalkState = !configured
    ? 'unavailable'
    : connecting
      ? 'connecting'
      : conversation.status === 'connected'
        ? conversation.isSpeaking
          ? 'speaking'
          : 'listening'
        : 'idle';

  return {
    talkState,
    canTalk: (phase === 'rest' || micAlwaysOn) && configured,
    micAlwaysOn,
    holding,
    holdStart,
    holdEnd,
    startTalk,
    stopTalk,
    agentLine,
    connected: conversation.status === 'connected',
  };
}
