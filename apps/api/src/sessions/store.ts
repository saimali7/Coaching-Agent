import { randomUUID } from 'node:crypto';

export type CoachingSession = {
  id: string;
  title: string;
  coachee: string;
  notes: string;
  scheduledAt: string;
  createdAt: string;
};

export type NewCoachingSession = Omit<CoachingSession, 'id' | 'createdAt'>;

const sessions = new Map<string, CoachingSession>();

export function listSessions(): CoachingSession[] {
  return [...sessions.values()].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

export function getSession(id: string): CoachingSession | undefined {
  return sessions.get(id);
}

export function createSession(input: NewCoachingSession): CoachingSession {
  const session: CoachingSession = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  sessions.set(session.id, session);
  return session;
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}

const seed: NewCoachingSession[] = [
  {
    title: 'Goal setting kickoff',
    coachee: 'Alex Rivera',
    notes: 'Define the 90 day outcome and the weekly review cadence.',
    scheduledAt: '2026-08-12T15:00:00.000Z',
  },
  {
    title: 'Feedback practice',
    coachee: 'Sam Chen',
    notes: 'Role play a difficult conversation with a direct report.',
    scheduledAt: '2026-08-19T13:30:00.000Z',
  },
];

for (const item of seed) createSession(item);
