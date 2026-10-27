import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeBand } from '../hardware/controller';
import { ANALYSIS_MODEL } from '../lib/analysis-model';
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
  model: ANALYSIS_MODEL,
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
      version: 2,
      migrate: (persisted, version) => {
        const p = persisted as Partial<Settings>;
        return {
          ...p,
          // Replace the prior default/base-model selection with the project
          // profile while preserving unrelated operator preferences.
          ...(version < 2 && (!p.model || p.model === 'gemma3:1b' || p.model === 'qwen2.5:3b')
            ? { model: ANALYSIS_MODEL }
            : {}),
        };
      },
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
