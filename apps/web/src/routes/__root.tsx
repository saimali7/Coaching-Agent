import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { QueryClient } from '@tanstack/react-query';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  notFoundComponent: () => <p className="muted">That page does not exist.</p>,
});

function RootLayout() {
  return (
    <div className="layout">
      <nav className="nav">
        <span className="brand">Coaching Agent</span>
        <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: 'active' }}>
          Home
        </Link>
        <Link to="/sessions" activeProps={{ className: 'active' }}>
          Sessions
        </Link>
      </nav>
      <Outlet />
      {import.meta.env.DEV ? (
        <>
          <TanStackRouterDevtools position="bottom-left" />
          <ReactQueryDevtools initialIsOpen={false} />
        </>
      ) : null}
    </div>
  );
}
