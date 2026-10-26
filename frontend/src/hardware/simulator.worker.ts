/// <reference lib="webworker" />
import { ThermalSimulator } from './simulator';
import type { SimConfig } from './simulator';
import type { Command } from './protocol';
let sim = new ThermalSimulator({}, Date.now());
const emit = (data: unknown) => self.postMessage(JSON.stringify(data) + '\n');
self.onmessage = (
  e: MessageEvent<
    | { type: 'command'; command: Command }
    | { type: 'config'; config: SimConfig }
    | { type: 'inject'; fault: 'thermal' | 'sensor' | 'recover' }
  >,
) => {
  const m = e.data;
  if (m.type === 'command') emit(sim.command(m.command, Date.now()));
  if (m.type === 'config') sim = new ThermalSimulator(m.config, Date.now());
  if (m.type === 'inject') {
    if (m.fault === 'thermal') sim.temp = sim.snapshot(Date.now()).trip_c! + 0.1;
    if (m.fault === 'sensor') sim.brokenSensor = true;
    if (m.fault === 'recover') {
      sim.brokenSensor = false;
      sim.temp = sim.config.ambient;
    }
    sim.guard(Date.now());
    emit(sim.snapshot(Date.now()));
  }
};
let previous = Date.now();
setInterval(() => {
  const now = Date.now();
  emit(sim.step(Math.min((now - previous) / 1000, 1), now));
  previous = now;
}, 500);
