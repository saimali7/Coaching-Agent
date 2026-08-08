import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, sessionsQueryOptions } from '../lib/api';

export const Route = createFileRoute('/sessions')({
  loader: ({ context }) => context.queryClient.ensureQueryData(sessionsQueryOptions),
  component: SessionsPage,
});

function SessionsPage() {
  const queryClient = useQueryClient();
  const { data: sessions } = useQuery(sessionsQueryOptions);
  const [form, setForm] = useState({ title: '', coachee: '', notes: '' });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: sessionsQueryOptions.queryKey });

  const create = useMutation({
    mutationFn: api.createSession,
    onSuccess: async () => {
      setForm({ title: '', coachee: '', notes: '' });
      await invalidate();
    },
  });

  const remove = useMutation({ mutationFn: api.deleteSession, onSuccess: invalidate });

  return (
    <section>
      <h1>Sessions</h1>

      {sessions?.length === 0 ? <p className="muted">No sessions scheduled yet.</p> : null}

      {sessions?.map((session) => (
        <article key={session.id} className="card">
          <h3>{session.title}</h3>
          <p className="muted">
            {session.coachee} · {new Date(session.scheduledAt).toLocaleString()}
          </p>
          {session.notes ? <p>{session.notes}</p> : null}
          <button
            type="button"
            className="link"
            onClick={() => remove.mutate(session.id)}
            disabled={remove.isPending}
          >
            Remove
          </button>
        </article>
      ))}

      <h2>Schedule a session</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate({
            ...form,
            scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }}
      >
        <label>
          Title
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <label>
          Coachee
          <input
            required
            value={form.coachee}
            onChange={(e) => setForm({ ...form, coachee: e.target.value })}
          />
        </label>
        <label>
          Notes
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>
        <button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Saving…' : 'Add session'}
        </button>
        {create.isError ? <p className="error">{create.error.message}</p> : null}
      </form>
    </section>
  );
}
