import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { ConversationProvider } from '@elevenlabs/react';
import { routeTree } from './routeTree.gen';
import { cueEngine } from './audio/cueEngine';
import { setCueSink, useSessionStore } from './engine/sessionStore';
import { startTelemetryFlusher } from './engine/telemetry';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// The engine emits cues; the audio layer plays them. Wiring them here keeps the
// state machine free of any dependency on the browser's audio stack.
setCueSink((cue) => cueEngine.play(cue));
cueEngine.setOnCueStart((id, requestedAt, startedAt) => {
  useSessionStore.getState().track('cue_latency', { id, ms: Math.round(startedAt - requestedAt) });
});
startTelemetryFlusher();

function Instrumentation() {
  // "Screen unlocks per session" is a headline metric — it needs an event to fire against.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        const s = useSessionStore.getState();
        if (s.phase === 'set' || s.phase === 'rest') s.track('screen_unlock');
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);
  return null;
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConversationProvider>
        <Instrumentation />
        <RouterProvider router={router} />
      </ConversationProvider>
    </QueryClientProvider>
  </StrictMode>,
);
