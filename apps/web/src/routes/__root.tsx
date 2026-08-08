import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { PhoneStage } from '../components';
import { DemoRig } from '../demo/DemoRig';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  notFoundComponent: () => <div className="cad-screen">That screen does not exist.</div>,
});

function RootLayout() {
  return (
    <PhoneStage rig={<DemoRig />}>
      <Outlet />
    </PhoneStage>
  );
}
