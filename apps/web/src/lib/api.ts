export type CoachingSession = {
  id: string;
  title: string;
  coachee: string;
  notes: string;
  scheduledAt: string;
  createdAt: string;
};

export type NewCoachingSession = Pick<CoachingSession, 'title' | 'coachee' | 'notes' | 'scheduledAt'>;

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed with status ${res.status}`);
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const api = {
  listSessions: () => request<{ sessions: CoachingSession[] }>('/api/sessions').then((r) => r.sessions),
  getSession: (id: string) =>
    request<{ session: CoachingSession }>(`/api/sessions/${id}`).then((r) => r.session),
  createSession: (input: NewCoachingSession) =>
    request<{ session: CoachingSession }>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then((r) => r.session),
  deleteSession: (id: string) => request<void>(`/api/sessions/${id}`, { method: 'DELETE' }),
};

export const sessionsQueryOptions = {
  queryKey: ['sessions'] as const,
  queryFn: api.listSessions,
};

export const sessionQueryOptions = (id: string) => ({
  queryKey: ['sessions', id] as const,
  queryFn: () => api.getSession(id),
});
