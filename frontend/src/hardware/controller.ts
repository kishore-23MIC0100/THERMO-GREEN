import { SAFETY } from '../lib/config';
export type Profile = 'IDLE' | 'INFERENCE' | 'TRAINING' | 'CUSTOM';
export type ControlSettings = {
  low: number;
  high: number;
  dwellMs: number;
  profile: Profile;
  customDuty: number;
};
export function normalizeBand(low: number, high: number) {
  const ceiling = SAFETY.tripC - SAFETY.setpointMarginC;
  const h = Math.max(15.5, Math.min(ceiling, Number.isFinite(high) ? high : ceiling));
  return { low: Math.max(15, Math.min(h - 0.5, Number.isFinite(low) ? low : 32)), high: h };
}
export function demand(profile: Profile, duty: number, elapsed: number): boolean {
  if (profile === 'IDLE') return false;
  if (profile === 'TRAINING') return true;
  const portion = profile === 'INFERENCE' ? 0.3 : Math.max(0, Math.min(1, duty));
  return elapsed % 30000 < portion * 30000;
}
export function decideHeater(input: {
  temp: number | null;
  fault: number;
  stale: boolean;
  current: boolean;
  lastChange: number;
  now: number;
  request: boolean;
  settings: ControlSettings;
}): boolean {
  const { temp, fault, stale, current, lastChange, now, request, settings } = input;
  if (temp === null || fault || stale || temp >= SAFETY.tripC - SAFETY.setpointMarginC)
    return false;
  const { low, high } = normalizeBand(settings.low, settings.high);
  if (temp > high || !request) return false; // An OFF safety decision never waits for dwell.
  if (now - lastChange < Math.max(SAFETY.dwellMs, settings.dwellMs)) return current;
  if (temp < low) return true;
  return current;
}
