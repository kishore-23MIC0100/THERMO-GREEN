import safety from '../../../shared/safety.json';
export const SAFETY = safety;
export const FAULTS = safety.faults;
export const faultNames = (mask: number) =>
  Object.entries(FAULTS)
    .filter(([, bit]) => mask & bit)
    .map(([name]) => name.replaceAll('_', ' '));
export type Mode = 'DISCONNECTED' | 'LIVE' | 'SIMULATED' | 'REPLAY';
export type Source = 'live' | 'simulated';
export type Claim =
  | 'MEASURED'
  | 'CALCULATED'
  | 'ESTIMATED'
  | 'SIMULATED'
  | 'PROJECTED'
  | 'UNAVAILABLE'
  | 'NOT CLAIMED';
