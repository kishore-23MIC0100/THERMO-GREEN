import { FAULTS, SAFETY } from '../lib/config';
import type { Telemetry } from './protocol';

export const validProbe = (value: number | null | undefined): value is number =>
  value != null &&
  Number.isFinite(value) &&
  value >= -55 &&
  value <= 125 &&
  value !== -127 &&
  value !== 85;

export function faultDetails(t: Telemetry, fresh: boolean) {
  const details: Array<{ name: string; explanation: string }> = [];
  const sensorsValid = validProbe(t.temp) && (t.temp2 == null || validProbe(t.temp2));
  if (t.fault & FAULTS.SENSOR_FAULT)
    details.push({
      name: 'Sensor fault',
      explanation: sensorsValid
        ? 'The sensor flag is latched, but the latest probe values are valid. Check stable readings and the sensor wiring before an explicit reset.'
        : 'A valid DS18B20 reading is unavailable. Keep heating OFF. Check the probe supply/ground, GPIO 4 data connection, and the documented pull-up before resetting.',
    });
  if (t.fault & FAULTS.LINK_TIMEOUT)
    details.push({
      name: 'Heartbeat timeout',
      explanation: fresh
        ? 'Fresh telemetry is arriving now. This latch can originate during boot or a missed heartbeat. Keep this tab active; explicitly reset after the cause is resolved.'
        : 'Telemetry is stale or missing. Restore the USB link and fresh heartbeats before attempting a reset. Firmware keeps heating OFF independently.',
    });
  if (t.fault & FAULTS.THERMAL_TRIP)
    details.push({
      name: 'Thermal trip',
      explanation: `Allow both available probes to cool below ${SAFETY.tripC - SAFETY.resetMarginC} °C. An operator must inspect the cause and reset; cooling alone does not clear the latch.`,
    });
  if (t.fault & FAULTS.E_STOP)
    details.push({
      name: 'Emergency stop',
      explanation:
        'Emergency stop is latched. Resolve the cause, confirm safe conditions, then explicitly reset. Reset leaves heating OFF.',
    });
  if (t.fault & FAULTS.BAD_COMMAND)
    details.push({
      name: 'Invalid command',
      explanation:
        'Firmware rejected a malformed or unsupported command. Use the v2 JSON sketch and 115200 baud; close other serial clients before reconnecting.',
    });
  return details;
}
