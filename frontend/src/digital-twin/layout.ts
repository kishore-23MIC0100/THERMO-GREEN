import type { PartId } from './parts';
export type Vec = [number, number, number];
// Product-visualization layout in illustrative units, independent of telemetry.
export const LAYOUT: Record<Exclude<PartId, 'tubes'>, { at: Vec; explode: Vec; label: Vec }> = {
  heater: { at: [-3.05, 0, 0], explode: [-0.3, 0.25, 0], label: [-0.3, 1.72, -0.15] },
  coldplate: { at: [-1.55, 0, 0], explode: [-0.15, 0.6, 0], label: [0, 1.55, 0] },
  pump: { at: [-0.15, 0, 0.95], explode: [0, 0.18, 0.5], label: [0, 0.06, 0.55] },
  exchanger: { at: [1.05, 0, 0], explode: [0, 0.6, 0], label: [0, 1.55, 0] },
  reactor: { at: [2.4, 0, -0.08], explode: [0.45, 0.2, -0.05], label: [-0.5, 2.05, 0] },
  probe: { at: [2.64, 0, -0.06], explode: [0.45, 0.8, 0], label: [0.9, 2.43, -0.08] },
  gas: { at: [3.62, 0, -0.57], explode: [0.6, 0.35, -0.3], label: [0.7, 1.45, -0.1] },
  esp32: { at: [3.65, 0, 0.82], explode: [0.6, 0.25, 0.3], label: [0, 0.05, 0.75] },
  relay: { at: [0.18, 0, -1.02], explode: [0, 0.3, -0.3], label: [0, 0.8, 0] },
  supply: { at: [-3.1, 0, -0.98], explode: [-0.2, 0.2, -0.3], label: [0, 0.8, 0] },
};
