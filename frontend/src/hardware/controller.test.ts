import { describe, it, expect } from 'vitest';
import { decideHeater, normalizeBand, demand } from './controller';
import { SAFETY } from '../lib/config';
const base = {
  temp: 28,
  fault: 0,
  stale: false,
  current: false,
  lastChange: 0,
  now: 6000,
  request: true,
  settings: { low: 32, high: 35, dwellMs: 5000, profile: 'TRAINING' as const, customDuty: 0.5 },
};
describe('controller', () => {
  it('clamps invalid settings below the firmware trip', () => {
    expect(normalizeBand(40, 40)).toEqual({ low: 34.5, high: 35 });
    expect(normalizeBand(NaN, NaN)).toEqual({ low: 32, high: 35 });
  });
  it('enforces dwell before enabling heat', () => {
    expect(decideHeater({ ...base, now: 1000 })).toBe(false);
    expect(decideHeater(base)).toBe(true);
  });
  it.each([
    { fault: 1 },
    { stale: true },
    { temp: null },
    { temp: SAFETY.tripC },
    { request: false },
  ])('turns OFF immediately for unsafe input', (patch) => {
    expect(decideHeater({ ...base, current: true, lastChange: 5999, ...patch })).toBe(false);
  });
  it('holds the last state within the temperature band', () => {
    expect(decideHeater({ ...base, temp: 33, current: false })).toBe(false);
    expect(decideHeater({ ...base, temp: 33, current: true })).toBe(true);
  });
  it('maps documented workload profiles', () => {
    expect(demand('IDLE', 1, 0)).toBe(false);
    expect(demand('INFERENCE', 0, 8000)).toBe(true);
    expect(demand('INFERENCE', 0, 9000)).toBe(false);
    expect(demand('TRAINING', 0, 29000)).toBe(true);
    expect(demand('CUSTOM', 0.5, 16000)).toBe(false);
  });
});
