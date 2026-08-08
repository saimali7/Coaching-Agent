import { createFileRoute } from '@tanstack/react-router';
import { LiveSession } from '../screens/LiveSession';

export const Route = createFileRoute('/')({
  component: LiveSession,
});
