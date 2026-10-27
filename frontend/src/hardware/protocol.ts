import { z } from 'zod';
import { FAULTS } from '../lib/config';
const rawTemp = z.number().finite().min(-127).max(125).nullable();
export const telemetrySchema = z.object({
  temp: rawTemp,
  temp2: rawTemp.optional(),
  gas: z.number().int().min(0).max(4095),
  heater: z.union([z.literal(0), z.literal(1)]),
  fault: z.number().int().min(0).max(31),
  v: z.literal(2).optional(),
  seq: z.number().int().nonnegative().optional(),
  uptime_ms: z.number().nonnegative().optional(),
  trip_c: z.number().min(10).max(60).optional(),
  ack: z.number().int().nonnegative().optional(),
  accepted: z.boolean().optional(),
  armed: z.boolean().optional(),
  firmware: z.string().max(64).optional(),
});
export type Telemetry = z.infer<typeof telemetrySchema> & {
  reportedFault?: number;
  sensorInvalid?: boolean;
};
export type Command =
  | { cmd: 'heater'; value: 0 | 1; id?: number }
  | { cmd: 'heartbeat' | 'estop' | 'reset_fault'; id?: number };
export function parseTelemetry(line: string): Telemetry {
  const data: Telemetry = telemetrySchema.parse(JSON.parse(line));
  data.reportedFault = data.fault;
  data.sensorInvalid = false;
  if (
    data.temp === null ||
    data.temp === -127 ||
    data.temp === 85 ||
    data.temp < -55 ||
    (data.temp2 != null && (data.temp2 === -127 || data.temp2 === 85 || data.temp2 < -55))
  ) {
    data.sensorInvalid = true;
    data.fault |= FAULTS.SENSOR_FAULT;
    if (data.temp === -127 || data.temp === 85 || (data.temp != null && data.temp < -55))
      data.temp = null;
    if (data.temp2 === -127 || data.temp2 === 85 || (data.temp2 != null && data.temp2 < -55))
      data.temp2 = null;
  }
  return data;
}
export class LineBuffer {
  private buffer = '';
  push(chunk: string): string[] {
    this.buffer += chunk;
    if (this.buffer.length > 16384 && !this.buffer.includes('\n')) {
      this.buffer = '';
      throw new Error('Serial line exceeded 16 KiB');
    }
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';
    return lines
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        if (line.length > 16384) throw new Error('Serial line exceeded 16 KiB');
        return line;
      });
  }
}
