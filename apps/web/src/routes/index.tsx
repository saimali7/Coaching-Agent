import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('API unreachable');
      return (await res.json()) as { status: string; uptime: number };
    },
  });

  return (
    <section>
      <h1>Coaching Agent</h1>
      <p className="muted">
        React + TanStack Router and Query on the front, Express on the back.
      </p>
      <p>
        API status:{' '}
        {health.isPending ? 'checking…' : health.isError ? <span className="error">offline</span> : health.data?.status}
      </p>
      <Link to="/sessions">Browse coaching sessions →</Link>
    </section>
  );
}
