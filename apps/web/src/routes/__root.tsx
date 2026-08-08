import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { PhoneStage } from '../components';
import { DemoRig } from '../demo/DemoRig';
import { CoachAgentProvider } from '../voice/CoachAgentProvider';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  notFoundComponent: () => <div className="cad-screen">That screen does not exist.</div>,
});

function RootLayout() {
  // The coach agent lives above the routes so navigation can never tear down
  // its socket, client tools or timers mid-conversation. It sits under
  // main.tsx's ConversationProvider and above PhoneStage so every route —
  // and the rig — sees the same agent.
  return (
    <CoachAgentProvider>
      <PhoneStage rig={<DemoRig />}>
        <Outlet />
      </PhoneStage>
    </CoachAgentProvider>
  );
}
