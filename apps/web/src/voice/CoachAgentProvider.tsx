import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useCoachAgent } from './useCoachAgent';

// The coach agent must outlive any single screen: the conversation socket,
// client tools, mic state and timers all live in useCoachAgent, and mounting
// that hook inside LiveSession meant a navigation to /summary (or a rig jump)
// tore it down mid-conversation while the socket lived on at the
// ConversationProvider level. This provider calls the hook ONCE at the root
// route, so screens can come and go while the agent keeps its state.
//
// Consumption contract: screens use useCoachAgentContext(), never
// useCoachAgent() directly.

type CoachAgent = ReturnType<typeof useCoachAgent>;

const CoachAgentContext = createContext<CoachAgent | null>(null);

export function CoachAgentProvider({ children }: { children: ReactNode }) {
  const agent = useCoachAgent();
  return <CoachAgentContext.Provider value={agent}>{children}</CoachAgentContext.Provider>;
}

/** The coach agent surface: same shape as useCoachAgent's return value. */
export function useCoachAgentContext(): CoachAgent {
  const ctx = useContext(CoachAgentContext);
  if (ctx === null) {
    throw new Error(
      'useCoachAgentContext must be used within a CoachAgentProvider — mount it in the root route.',
    );
  }
  return ctx;
}
