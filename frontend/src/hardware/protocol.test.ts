import { describe, it, expect } from 'vitest';
import { parseTelemetry, LineBuffer } from './protocol';
import { FAULTS } from '../lib/config';
describe('telemetry protocol', () => {
  it('accepts legacy and additive v2 messages', () => {
    expect(parseTelemetry('{"temp":34.2,"gas":1830,"heater":1,"fault":0}').temp).toBe(34.2);
    expect(
      parseTelemetry('{"v":2,"temp":28,"temp2":null,"gas":0,"heater":0,"fault":0,"seq":1,"ack":17}')
        .ack,
    ).toBe(17);
  });
  it.each([-127, 85, null])(
    'classifies invalid sensor value %s as a fault without inventing a reading',
    (temp) => {
      const result = parseTelemetry(JSON.stringify({ temp, gas: 0, heater: 0, fault: 0 }));
      expect(result.temp).toBeNull();
      expect(result.fault & FAULTS.SENSOR_FAULT).toBeTruthy();
    },
  );
  it.each([
    'not json',
    '{}',
    '{"temp":28,"gas":4096,"heater":0,"fault":0}',
    '{"temp":28,"gas":0,"heater":2,"fault":0}',
    '{"temp":28,"gas":0,"heater":0,"fault":32}',
  ])('rejects malformed or out-of-range input', (line) =>
    expect(() => parseTelemetry(line)).toThrow(),
  );
  it('preserves split lines and CRLF', () => {
    const buffer = new LineBuffer();
    expect(buffer.push('{"te')).toEqual([]);
    expect(buffer.push('mp":1}\r\n{"a":')).toEqual(['{"temp":1}']);
    expect(buffer.push('2}\n\n')).toEqual(['{"a":2}']);
  });
  it('bounds line memory', () => {
    expect(() => new LineBuffer().push('a'.repeat(16385))).toThrow();
  });
});
