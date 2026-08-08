import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useConversation } from '@elevenlabs/react';
import { useSessionStore, buildCoachContext, setRestSinks } from '../engine/sessionStore';
import type { SessionState } from '../engine/sessionStore';
import { cueEngine } from '../audio/cueEngine';
import { toDynamicVariables, toContextualUpdate, toLiveUpdate } from './context';

export type TalkState = 'unavailable' | 'idle' | 'connecting' | 'listening' | 'speaking';

// The always-live companion. The socket comes up on the first user gesture and
// stays up for the whole session: push to talk in every phase, event-driven
// context updates (plus a fresh snapshot on every hold), auto-reconnect with
// backoff, and voice performance logging. When the rig flips `micAlwaysOn`
// off, the old rest-only product rules (#31–#34, #39) bind again: hard gate
// outside REST, rest-exit endSession, gate-blocked telemetry.
//
// This hook is mounted ONCE, by CoachAgentProvider at the root route, so the
// conversation, its client tools and its timers survive screen navigation.
// Screens consume it via useCoachAgentContext().

/** Debounce for event-driven live updates so bursts coalesce into one send. */
const LIVE_DEBOUNCE_MS = 300;
/** Reconnect backoff: 2 s doubling to a 30 s cap, reset on successful connect. */
const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 30_000;
/** Mic stays open this long after release so the last word is not clipped. */
const RELEASE_TAIL_MS = 350;
/** A caption is cleared this long after the agent stops speaking. */
const CAPTION_LINGER_MS = 20_000;
/** Safety valve: an in-flight connect that never settles is abandoned. */
const CONNECT_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Single-flight connection gate (bug: connect race double-starting sessions).
//
// `connect()` is async: the eager pointerdown listener and holdStart can fire
// from the SAME tap (pointerdown on the talk button bubbles to window). React
// state does not update synchronously, so a state guard cannot stop the second
// caller. This module-level promise is set synchronously before any await —
// every concurrent caller awaits the SAME connection attempt, and the promise
// settles from onConnect (true) or onDisconnect/onError/start failure (false).
// ---------------------------------------------------------------------------

let inFlight: Promise<boolean> | null = null;
let inFlightResolve: ((ok: boolean) => void) | null = null;

function settleInFlight(ok: boolean): void {
  const resolve = inFlightResolve;
  inFlight = null;
  inFlightResolve = null;
  resolve?.(ok);
}

/** Seconds into the current working set; 0 outside one. */
function setElapsedSec(s: SessionState): number {
  if (s.phase !== 'set') return 0;
  const current = s.sets.at(-1);
  if (!current) return 0;
  return Math.max(0, Math.round((s.sessionClock - current.startedAt) / 1000));
}

/** The session is over; no connection should be made or resurrected. */
function sessionFinished(s: SessionState): boolean {
  return s.phase === 'complete' || s.phase === 'aborted';
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
  const configuredRef = useRef(configured);
  configuredRef.current = configured;
  const everConnectedRef = useRef(false);
  const manualStopRef = useRef(false);
  const backoffRef = useRef(RECONNECT_BASE_MS);
  const attemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Mirrors `holding` synchronously — timers and awaits must not read stale state. */
  const holdingRef = useRef(false);
  /** Pending delayed mute after holdEnd; non-null means the release tail is active. */
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Pending caption expiry after the agent stops speaking. */
  const captionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const clearReleaseTimer = useCallback(() => {
    if (releaseTimerRef.current !== null) {
      clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      setConnecting(false);
      everConnectedRef.current = true;
      backoffRef.current = RECONNECT_BASE_MS;
      attemptRef.current = 0;
      clearReconnectTimer();
      useSessionStore.getState().track('agent_connect');
      // Connect-time enforcement: the SDK resets mute to open on every new
      // conversation, so a fresh session must be re-muted unless a hold is
      // active right now (mic state is owned by applyMicState alone).
      applyMicState();
      settleInFlight(true);
    },
    onDisconnect: () => {
      setConnecting(false);
      clearReleaseTimer();
      holdingRef.current = false;
      setHolding(false);
      const s = useSessionStore.getState();
      s.setAgentActive(false);
      s.track('agent_disconnect');
      cueEngine.setDucked(false);
      setAgentLine(null);
      settleInFlight(false);
      maybeScheduleReconnect();
    },
    onError: (message) => {
      // Socket-drop fallback (#39): Tier 0 keeps running, the agent goes quiet —
      // and, in always-live mode, quietly tries to come back.
      setConnecting(false);
      clearReleaseTimer();
      const s = useSessionStore.getState();
      s.setAgentActive(false);
      s.track('agent_disconnect', { error: message });
      cueEngine.setDucked(false);
      settleInFlight(false);
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

  // The single owner of microphone state. Desired mute is computed from the
  // hold and the release tail — nothing else may call setMuted, so nothing
  // can fight the SDK or re-assert mute mid-hold / unmute mid-release.
  const applyMicState = useCallback(() => {
    const c = conversationRef.current;
    if (c.status !== 'connected') return;
    const desiredMuted = !(holdingRef.current || releaseTimerRef.current !== null);
    try {
      c.setMuted(desiredMuted);
    } catch {
      // The conversation raced away between the status check and the call.
    }
  }, []);

  /**
   * Open the socket if needed. Single-flight: the in-flight promise is set
   * synchronously before any await, so concurrent callers (eager pointerdown +
   * holdStart from the same tap, the reconnect timer) share ONE attempt and
   * ONE conversation. Resolves true only once the session is actually
   * connected. The mic starts muted — holding is what opens it.
   */
  const connect = useCallback((): Promise<boolean> => {
    if (conversationRef.current.status === 'connected') return Promise.resolve(true);
    if (inFlight) return inFlight;

    inFlight = new Promise<boolean>((resolve) => {
      const watchdog = setTimeout(() => settleInFlight(false), CONNECT_TIMEOUT_MS);
      inFlightResolve = (ok) => {
        clearTimeout(watchdog);
        resolve(ok);
      };
    });
    const flight = inFlight;

    manualStopRef.current = false;
    setConnecting(true);

    void (async () => {
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
        // startSession is fire-and-forget; the flight settles from onConnect
        // (true) or onDisconnect/onError (false).
      } catch {
        setConnecting(false);
        useSessionStore.getState().track('agent_disconnect', { error: 'start_failed' });
        settleInFlight(false);
      }
    })();

    return flight;
  }, []);

  /**
   * Auto-reconnect (always-live only). Backoff doubles from 2 s to a 30 s cap
   * and resets on a successful connect. Never loops when unconfigured: it arms
   * only after a successful connect or a positive /api/voice/status. A manual
   * stopTalk() marks the disconnect as intentional and suppresses it. A
   * finished session (complete/aborted) is never resurrected.
   */
  const maybeScheduleReconnect = useCallback(() => {
    if (manualStopRef.current) return;
    const store = useSessionStore.getState();
    if (sessionFinished(store)) return;
    if (!store.micAlwaysOn) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    if (!everConnectedRef.current && !configuredRef.current) return;
    if (reconnectTimerRef.current !== null) return;

    const delay = backoffRef.current;
    backoffRef.current = Math.min(RECONNECT_MAX_MS, backoffRef.current * 2);
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      const s = useSessionStore.getState();
      // The session may have finished, or the rig may have restored rest-only
      // mode, while the timer was pending.
      if (sessionFinished(s)) return;
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
  // attempt re-arms on the next gesture. Never fires for a finished session —
  // the listener stays armed for the next one instead.
  useEffect(() => {
    if (!configured) return;
    let disposed = false;
    const onPointerDown = () => {
      const s = useSessionStore.getState();
      if (sessionFinished(s)) return;
      if (conversationRef.current.status === 'connected') return;
      window.removeEventListener('pointerdown', onPointerDown);
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
      clearReleaseTimer();
      c.endSession();
      setConnecting(false);
      settleInFlight(false);
      holdingRef.current = false;
      setHolding(false);
      useSessionStore.getState().track('agent_gate_blocked', { phase });
    }
  }, [phase, connecting, micAlwaysOn, clearReconnectTimer, clearReleaseTimer]);

  /** Send one compact live line built from the store's current truth. */
  const sendLiveUpdate = useCallback(() => {
    const c = conversationRef.current;
    if (c.status !== 'connected') return;
    const s = useSessionStore.getState();
    c.sendContextualUpdate(
      toLiveUpdate(buildCoachContext(s), {
        sessionClockMs: s.sessionClock,
        setElapsedSeconds: setElapsedSec(s),
      }),
    );
  }, []);

  // Live context, event-driven and deliberately sparse: phase changes, the
  // pending adaptation appearing or resolving, and session complete/abort
  // (both are phase changes). NOT individual reps, NOT HR drift, NOT rest
  // countdown ticks — flooding the history with those made the agent comment
  // on stale numbers unprompted. The holdStart snapshot covers freshness at
  // the only moment it matters: right before the user asks something.
  // Debounced so a burst (set end + rest entry) coalesces into one send.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const signature = (s: SessionState) => ({
      phase: s.phase,
      pending: s.pendingAdaptation !== null,
    });
    let prev = signature(useSessionStore.getState());
    const unsubscribe = useSessionStore.subscribe((state) => {
      const next = signature(state);
      if (next.phase === prev.phase && next.pending === prev.pending) return;
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

  // Ducking follows speech, not connection: an always-live socket must not
  // permanently duck Tier-0 cues. The orb mirrors the same signal.
  useEffect(() => {
    const speaking = conversation.status === 'connected' && conversation.isSpeaking;
    cueEngine.setDucked(speaking);
    useSessionStore.getState().setAgentActive(speaking);
  }, [conversation.status, conversation.isSpeaking]);

  // Caption lifetime: a line lingers 20 s after the agent stops speaking, then
  // clears. A new message (agentLine changes) or resumed speech resets the
  // timer. Without this, an old answer sits on screen across phases and looks
  // like the agent said it again.
  useEffect(() => {
    if (captionTimerRef.current !== null) {
      clearTimeout(captionTimerRef.current);
      captionTimerRef.current = null;
    }
    if (agentLine === null) return;
    if (conversation.status === 'connected' && conversation.isSpeaking) return;
    captionTimerRef.current = setTimeout(() => {
      captionTimerRef.current = null;
      setAgentLine(null);
    }, CAPTION_LINGER_MS);
    return () => {
      if (captionTimerRef.current !== null) {
        clearTimeout(captionTimerRef.current);
        captionTimerRef.current = null;
      }
    };
  }, [agentLine, conversation.status, conversation.isSpeaking]);

  // A finished session shows no ghost caption on the summary.
  useEffect(() => {
    if (phase === 'complete' || phase === 'aborted') setAgentLine(null);
  }, [phase]);

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
    clearReleaseTimer();
    conversationRef.current.endSession();
    setConnecting(false);
    settleInFlight(false);
    holdingRef.current = false;
    setHolding(false);
  }, [clearReconnectTimer, clearReleaseTimer]);

  // --- push to talk ---------------------------------------------------------
  const holdStart = useCallback(async () => {
    const s = useSessionStore.getState();
    if (s.phase !== 'rest' && !s.micAlwaysOn) {
      s.track('agent_gate_blocked', { phase: s.phase, reason: 'hold_outside_rest' });
      return;
    }
    // A quick re-press lands inside the release tail: cancel the pending mute
    // so the mic never blips shut mid-sentence.
    clearReleaseTimer();
    holdingRef.current = true;
    setHolding(true);
    const ready = await connect();
    if (!ready || conversationRef.current.status !== 'connected') return;
    if (!holdingRef.current) {
      // Released while the connection was still coming up.
      applyMicState();
      return;
    }
    // Fresh context ONCE, right before the question — this is the only moment
    // freshness matters for the answer, and it must precede the unmute so the
    // update lands before the user's words.
    sendLiveUpdate();
    // Signal user activity so the agent holds back instead of starting a new
    // utterance over the user's question.
    try {
      conversationRef.current.sendUserActivity();
    } catch {
      // No active conversation despite the status check — nothing to signal.
    }
    applyMicState();
  }, [connect, clearReleaseTimer, sendLiveUpdate, applyMicState]);

  const holdEnd = useCallback(() => {
    holdingRef.current = false;
    setHolding(false);
    // Closing the mic is what ends the turn; the socket stays open so the
    // agent can answer and remember the exchange. The mute itself is delayed
    // by a short tail so the last word of the question is not clipped —
    // an instant mute hands ASR a fragment and produces confused answers.
    if (conversationRef.current.status !== 'connected') return;
    clearReleaseTimer();
    releaseTimerRef.current = setTimeout(() => {
      releaseTimerRef.current = null;
      applyMicState();
    }, RELEASE_TAIL_MS);
  }, [clearReleaseTimer, applyMicState]);

  // Unmount: no timer may outlive the hook, and ducking is restored.
  useEffect(() => {
    return () => {
      clearReconnectTimer();
      clearReleaseTimer();
      if (captionTimerRef.current !== null) {
        clearTimeout(captionTimerRef.current);
        captionTimerRef.current = null;
      }
      cueEngine.setDucked(false);
      useSessionStore.getState().setAgentActive(false);
    };
  }, [clearReconnectTimer, clearReleaseTimer]);

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
