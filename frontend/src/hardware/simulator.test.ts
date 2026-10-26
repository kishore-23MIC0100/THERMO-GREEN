import { describe, it, expect } from 'vitest';
import { ThermalSimulator } from './simulator';
import { parseTelemetry } from './protocol';
import { SAFETY, FAULTS } from '../lib/config';
describe('thermal simulator', () => {
  it('obeys the lumped capacitance equation without losses', () => {
    const sim = new ThermalSimulator({ capacity: 1380, loss: 0, efficiency: 1 });
    sim.command({ cmd: 'heater', value: 1 }, 0);
    expect(sim.step(1, 1000).temp).toBeCloseTo(28 + 40 / 1380, 5);
  });
  it('shuts down after missed heartbeat including when the browser is hidden', () => {
    const sim = new ThermalSimulator();
    sim.command({ cmd: 'heater', value: 1 }, 0);
    const t = sim.step(0.5, SAFETY.watchdogMs + 1);
    expect(t.heater).toBe(0);
    expect(t.fault & FAULTS.LINK_TIMEOUT).toBeTruthy();
  });
  it('latches a thermal trip and rejects reset until cool', () => {
    const sim = new ThermalSimulator();
    sim.temp = SAFETY.tripC;
    expect(sim.command({ cmd: 'heater', value: 1, id: 7 }, 0).accepted).toBe(false);
    expect(sim.fault & FAULTS.THERMAL_TRIP).toBeTruthy();
    expect(sim.command({ cmd: 'reset_fault' }, 0).accepted).toBe(false);
    sim.temp = 28;
    expect(sim.command({ cmd: 'reset_fault' }, 0).accepted).toBe(true);
    expect(sim.heater).toBe(0);
  });
  it('uses the same schema, ids and fault behavior as firmware', () => {
    const sim = new ThermalSimulator();
    expect(parseTelemetry(JSON.stringify(sim.command({ cmd: 'estop', id: 42 }, 0))).ack).toBe(42);
    expect(sim.heater).toBe(0);
    expect(sim.fault & FAULTS.E_STOP).toBeTruthy();
  });
  it('rejects reset while the sensor remains disconnected', () => {
    const sim = new ThermalSimulator();
    sim.brokenSensor = true;
    sim.step(0.5, 500);
    expect(sim.snapshot(500).temp).toBeNull();
    expect(sim.command({ cmd: 'reset_fault' }, 500).accepted).toBe(false);
  });
  it('trips at the threshold even under accelerated simulation', () => {
    const sim = new ThermalSimulator({ speed: 30, loss: 0, capacity: 1380, efficiency: 1 });
    for (let now = 0; now < 20000; now += 500) {
      sim.command({ cmd: 'heartbeat' }, now);
      sim.command({ cmd: 'heater', value: 1 }, now);
      sim.step(0.5, now);
    }
    expect(sim.fault & FAULTS.THERMAL_TRIP).toBeTruthy();
    expect(sim.temp).toBeLessThan(SAFETY.tripC + 0.01);
  });
});
