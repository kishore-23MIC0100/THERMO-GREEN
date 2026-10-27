import { lazy } from 'react';
// Share one resolved lazy component between dashboard and dedicated route.
// A second lazy wrapper can suspend navigation during frequent telemetry updates.
export const TwinScene = lazy(() => import('./Scene'));
