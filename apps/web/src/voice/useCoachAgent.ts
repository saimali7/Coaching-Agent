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
  const [agentLine, setAgentLine] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

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
        const c = conversationRef.current;
        if (c.status === 'connected' || c.status === 'connecting') c.endSession();
      },
    });
    return () => setRestSinks(null);
  }, []);

  // Defensive hard gate (#32): whatever moved the machine out of REST —
  // demo jumps included — the agent is cut off.
  useEffect(() => {
    const c = conversationRef.current;
    if (phase !== 'rest' && (c.status === 'connected' || connecting)) {
      c.endSession();
      setConnecting(false);
      useSessionStore.getState().track('agent_gate_blocked', { phase });
    }
  }, [phase, connecting]);

  // The sheet resolving mid-conversation changes the truth — refresh the context.
  useEffect(() => {
    const c = conversationRef.current;
    if (c.status === 'connected') {
      c.sendContextualUpdate(toContextualUpdate(buildCoachContext(useSessionStore.getState())));
    }
  }, [pendingAdaptation]);

  const startTalk = useCallback(async () => {
    const s = useSessionStore.getState();
    if (s.phase !== 'rest') {
      s.track('agent_gate_blocked', { phase: s.phase, reason: 'start_outside_rest' });
      return;
    }
    if (conversationRef.current.status === 'connected' || connecting) return;
    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const res = await fetch('/api/voice/signed-url');
      if (!res.ok) throw new Error('signed url unavailable');
      const { signedUrl } = (await res.json()) as { signedUrl: string };
      conversationRef.current.startSession({
        signedUrl,
        connectionType: 'websocket',
        dynamicVariables: toDynamicVariables(buildCoachContext(useSessionStore.getState())),
      });
    } catch {
      setConnecting(false);
      useSessionStore.getState().track('agent_disconnect', { error: 'start_failed' });
    }
  }, [connecting]);

  const stopTalk = useCallback(() => {
    conversationRef.current.endSession();
    setConnecting(false);
  }, []);

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
    canTalk: phase === 'rest' && configured,
    startTalk,
    stopTalk,
    agentLine,
    connected: conversation.status === 'connected',
  };
}
