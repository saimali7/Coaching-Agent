import { createFileRoute } from '@tanstack/react-router';
import { Summary } from '../screens/Summary';

export const Route = createFileRoute('/summary')({
  component: Summary,
});
