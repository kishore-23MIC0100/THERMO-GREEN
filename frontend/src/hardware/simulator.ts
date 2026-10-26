import { FAULTS, SAFETY } from '../lib/config';
import type { Command, Telemetry } from './protocol';
export type SimConfig = {
  ambient: number;
  capacity: number;
  loss: number;
  efficiency: number;
  speed: number;
};
export const defaultSim: SimConfig = {
  ambient: 28,
  capacity: 1580,
  loss: 1.1,
  efficiency: 0.9,
  speed: 1,
};
export class ThermalSimulator {
  config: SimConfig;
  temp: number;
  heater: 0 | 1 = 0;
  fault = 0;
  seq = 0;
  lastHeartbeat = 0;
  started = 0;
  brokenSensor = false;
  constructor(config: Partial<SimConfig> = {}, now = 0) {
    this.config = { ...defaultSim, ...config };
    this.temp = this.config.ambient;
    this.started = now;
    this.lastHeartbeat = now;
  }
  command(c: Command, now: number): Telemetry {
    let accepted = true;
    if (c.cmd === 'heartbeat') this.lastHeartbeat = now;
    if (c.cmd === 'estop') this.fault |= FAULTS.E_STOP;
    this.guard(now);
    if (c.cmd === 'reset_fault') {
      accepted =
        this.temp < SAFETY.tripC - SAFETY.resetMarginC &&
        !this.brokenSensor &&
        now - this.lastHeartbeat <= SAFETY.watchdogMs;
      if (accepted) {
        this.fault = 0;
        this.heater = 0;
      }
    }
    if (c.cmd === 'heater') {
      accepted = c.value === 0 || this.fault === 0;
      this.heater = accepted ? c.value : 0;
    }
    this.guard(now);
    return { ...this.snapshot(now), ack: c.id, accepted };
  }
  guard(now: number) {
    if (this.temp >= SAFETY.tripC) this.fault |= FAULTS.THERMAL_TRIP;
    if (this.brokenSensor) this.fault |= FAULTS.SENSOR_FAULT;
    if (now - this.lastHeartbeat > SAFETY.watchdogMs) this.fault |= FAULTS.LINK_TIMEOUT;
    if (this.fault) this.heater = 0;
  }
  step(dt: number, now: number): Telemetry {
    this.guard(now);
    // Substeps preserve the trip boundary even at accelerated demo speed.
    let remaining = dt * this.config.speed;
    while (remaining > 0) {
      const h = Math.min(remaining, 0.1);
      this.temp +=
        ((40 * this.heater * this.config.efficiency -
          this.config.loss * (this.temp - this.config.ambient)) /
          this.config.capacity) *
        h;
      remaining -= h;
      this.guard(now);
    }
    return this.snapshot(now);
  }
  snapshot(now: number): Telemetry {
    return {
      v: 2,
      seq: this.seq++,
      uptime_ms: now - this.started,
      temp: this.brokenSensor ? null : this.temp,
      temp2: null,
      gas: Math.round(1800 + Math.sin((now - this.started) / 7000) * 25),
      heater: this.heater,
      fault: this.fault,
      trip_c: SAFETY.tripC,
      armed: true,
      firmware: 'simulator-1.0.0',
    };
  }
}
