import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useConversation } from '@elevenlabs/react';
import { useSessionStore, buildCoachContext, setRestSinks } from '../engine/sessionStore';
import { cueEngine } from '../audio/cueEngine';
import { toDynamicVariables, toContextualUpdate } from './context';

export type TalkState = 'unavailable' | 'idle' | 'connecting' | 'listening' | 'speaking';

// Block 5 invariants:
// #31 mic is offered only in REST · #32 hard gate outside REST · #33 the agent is
// interrupted the instant REST ends — it never speaks into a working set ·
// #34 context is rebuilt on every REST entry · #39 on socket drop the agent goes
// quiet and Tier 0 carries on.
export function useCoachAgent() {
  const phase = useSessionStore((s) => s.phase);
  const pendingAdaptation = useSessionStore((s) => s.pendingAdaptation);
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

  const conversation = useConversation({
    onConnect: () => {
      setConnecting(false);
      const s = useSessionStore.getState();
      s.setAgentActive(true);
      s.track('agent_connect');
      cueEngine.setDucked(true);
    },
    onDisconnect: () => {
      setConnecting(false);
      const s = useSessionStore.getState();
      s.setAgentActive(false);
      s.track('agent_disconnect');
      cueEngine.setDucked(false);
      setAgentLine(null);
    },
    onError: (message) => {
      // Socket-drop fallback (#39): Tier 0 keeps running, the agent goes quiet.
      setConnecting(false);
      const s = useSessionStore.getState();
      s.setAgentActive(false);
      s.track('agent_disconnect', { error: message });
      cueEngine.setDucked(false);
    },
    onMessage: ({ message, source }) => {
      if (source === 'ai') setAgentLine(message);
    },
    clientTools: {
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
        if (c.status === 'connected' || c.status === 'connecting') c.endSession();
      },
    });
    return () => setRestSinks(null);
  }, []);

  // Defensive hard gate (#32): whatever moved the machine out of REST —
  // demo jumps included — the agent is cut off. The rig can lift this for
  // free-form conversation, which is a demo affordance, not the product.
  useEffect(() => {
    if (micAlwaysOn) return;
    const c = conversationRef.current;
    if (phase !== 'rest' && (c.status === 'connected' || connecting)) {
      c.endSession();
      setConnecting(false);
      setHolding(false);
      useSessionStore.getState().track('agent_gate_blocked', { phase });
    }
  }, [phase, connecting, micAlwaysOn]);

  // The sheet resolving mid-conversation changes the truth — refresh the context.
  useEffect(() => {
    const c = conversationRef.current;
    if (c.status === 'connected') {
      c.sendContextualUpdate(toContextualUpdate(buildCoachContext(useSessionStore.getState())));
    }
  }, [pendingAdaptation]);

  /** Open the socket if needed. The mic starts muted — holding is what opens it. */
  const connect = useCallback(async (): Promise<boolean> => {
    const c = conversationRef.current;
    if (c.status === 'connected') return true;
    if (connecting) return false;
    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const res = await fetch('/api/voice/signed-url');
      if (!res.ok) throw new Error('signed url unavailable');
      const { signedUrl } = (await res.json()) as { signedUrl: string };
      c.startSession({
        signedUrl,
        connectionType: 'websocket',
        dynamicVariables: toDynamicVariables(buildCoachContext(useSessionStore.getState())),
      });
      return true;
    } catch {
      setConnecting(false);
      useSessionStore.getState().track('agent_disconnect', { error: 'start_failed' });
      return false;
    }
  }, [connecting]);

  const startTalk = useCallback(async () => {
    const s = useSessionStore.getState();
    if (s.phase !== 'rest' && !s.micAlwaysOn) {
      s.track('agent_gate_blocked', { phase: s.phase, reason: 'start_outside_rest' });
      return;
    }
    await connect();
  }, [connect]);

  const stopTalk = useCallback(() => {
    conversationRef.current.endSession();
    setConnecting(false);
    setHolding(false);
  }, []);

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
    conversation.setMuted(!holding);
  }, [conversation, conversation.status, holding]);

  const configured = voiceStatus.data?.configured ?? false;
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
