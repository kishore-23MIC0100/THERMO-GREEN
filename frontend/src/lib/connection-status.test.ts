import { expect, it } from 'vitest';
import { connectionStatus } from './connection-status';
const base = { mode: 'LIVE' as const, busy: false, telemetry: null, receivedAt: 0, now: 6000 };
it('requires validated telemetry before displaying LIVE', () => {
  expect(connectionStatus(base)).toBe('AWAITING TELEMETRY');
  const telemetry = { temp: 28, gas: 1860, fault: 0, heater: 0 as const };
  expect(connectionStatus({ ...base, telemetry, receivedAt: 5500 })).toBe('LIVE');
  expect(connectionStatus({ ...base, telemetry, receivedAt: 3000 })).toBe('STALE');
  expect(
    connectionStatus({ ...base, telemetry: { ...telemetry, fault: 1 }, receivedAt: 5500 }),
  ).toBe('FAULT');
});
