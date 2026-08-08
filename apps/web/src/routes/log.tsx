import { createFileRoute } from '@tanstack/react-router';
import { AdaptationLog } from '../screens/AdaptationLog';

export const Route = createFileRoute('/log')({
  component: AdaptationLog,
});
