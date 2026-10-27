import { beforeEach, describe, expect, it } from 'vitest';
import { SAFETY } from '../lib/config';
import type { Telemetry } from '../hardware/protocol';
import { canHeat, useRuntime } from './runtime';
import { useSettings } from './settings';

const valid: Telemetry = {
  v: 2,
  temp: 30,
  gas: 1000,
  heater: 0,
  fault: 0,
  armed: true,
  trip_c: SAFETY.tripC,
};
beforeEach(() => {
  useSettings.setState({ low: 32, high: 35 });
  useRuntime.setState({
    ...useRuntime.getInitialState(),
    mode: 'LIVE',
    now: 10000,
    receivedAt: 10000,
    lastChange: 0,
    telemetry: { ...valid },
  });
});
describe('runtime heating gate', () => {
  it('respects a lower operator ceiling in manual mode', () => {
    useSettings.setState({ high: 25 });
    expect(canHeat()).toBe(false);
  });
  it('permits only fresh explicitly armed compatible telemetry after dwell', () => {
    expect(canHeat()).toBe(true);
  });
  it.each<Partial<Telemetry>>([
    { armed: undefined },
    { armed: false },
    { trip_c: undefined },
    { trip_c: SAFETY.tripC + 1 },
    { temp: SAFETY.tripC },
    { temp2: SAFETY.tripC },
    { temp: null },
    { fault: 1 },
    { v: undefined },
  ])('rejects unsafe or incomplete device evidence: %j', (patch) => {
    useRuntime.setState({ telemetry: { ...valid, ...patch } });
    expect(canHeat()).toBe(false);
  });
  it.each([
    { receivedAt: 0 },
    { lastChange: 9900 },
    { heartbeatPaused: true },
    { recordingError: true },
    { mode: 'REPLAY' as const },
    { mode: 'DISCONNECTED' as const },
  ])('rejects unsafe runtime state: %j', (patch) => {
    useRuntime.setState(patch);
    expect(canHeat()).toBe(false);
  });
});
