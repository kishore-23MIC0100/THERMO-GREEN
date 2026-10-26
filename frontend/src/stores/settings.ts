import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeBand } from '../hardware/controller';
export interface Settings {
  low: number;
  high: number;
  dwellMs: number;
  baud: number;
  units: 'C' | 'F';
  reducedMotion: boolean;
  quality: 'low' | 'medium' | 'high';
  ollamaUrl: string;
  model: string;
  massG: number;
  cp: number;
  simAmbient: number;
  simCapacity: number;
  simLoss: number;
  simSpeed: number;
  tourDone: boolean;
}
const defaults: Settings = {
  low: 32,
  high: 35,
  dwellMs: 5000,
  baud: 115200,
  units: 'C',
  reducedMotion: false,
  quality: 'medium',
  ollamaUrl: 'http://localhost:11434',
  model: 'gemma3:1b',
  massG: 330,
  cp: 4.184,
  simAmbient: 28,
  simCapacity: 1580,
  simLoss: 1.1,
  simSpeed: 1,
  tourDone: false,
};
export const useSettings = create<Settings & { update: (patch: Partial<Settings>) => void }>()(
  persist(
    (set) => ({
      ...defaults,
      update: (patch) =>
        set((s) => {
          const merged = { ...s, ...patch };
          return { ...patch, ...normalizeBand(merged.low, merged.high) };
        }),
    }),
    {
      name: 'algaerhythm-settings',
      version: 1,
      merge: (persisted, current) => {
        const p = persisted as Partial<Settings>;
        return {
          ...current,
          ...p,
          ...normalizeBand(p.low ?? defaults.low, p.high ?? defaults.high),
        };
      },
    },
  ),
);
