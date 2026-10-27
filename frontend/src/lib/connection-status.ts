import { SAFETY, type Mode } from './config';
import type { Telemetry } from '../hardware/protocol';
export function connectionStatus(s: {
  mode: Mode;
  busy: boolean;
  telemetry: Telemetry | null;
  receivedAt: number;
  now: number;
}) {
  if (s.busy) return 'CONNECTING';
  if (s.mode === 'DISCONNECTED') return 'DISCONNECTED';
  if (s.mode === 'REPLAY') return 'REPLAY';
  if (!s.telemetry || !s.receivedAt) return 'AWAITING TELEMETRY';
  if (s.now - s.receivedAt > SAFETY.staleMs) return 'STALE';
  if (s.telemetry.fault) return 'FAULT';
  return s.mode;
}
