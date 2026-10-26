import { describe, it, expect } from 'vitest';
import { metrics, lttb, csvCell } from './metrics';
import type { Sample } from '../db/database';
const sample = (time: number, temp: number, heater: 0 | 1 = 1): Sample => ({
  timestamp: time,
  temp,
  heater,
  gas: 1800,
  fault: 0,
  sessionId: 'test',
  source: 'simulated',
});
describe('analysis', () => {
  it('needs at least two stored samples', () => expect(metrics([sample(0, 28)])).toBeNull());
  it('computes Q and a time-based slope', () => {
    const result = metrics([sample(0, 28), sample(1000, 29), sample(2000, 30)], 330, 4.184);
    expect(result?.energyJ).toBeCloseTo(2761.44);
    expect(result?.rate).toBeCloseTo(60);
    expect(result?.duty).toBe(100);
  });
  it('excludes gaps from duty integration', () => {
    const result = metrics([sample(0, 28, 0), sample(1000, 29, 1), sample(10000, 30, 1)]);
    expect(result?.duty).toBe(0);
  });
  it('preserves endpoints and spikes during downsampling', () => {
    const rows = Array.from({ length: 1000 }, (_, i) => ({ x: i, y: i === 500 ? 1000 : 0 }));
    const result = lttb(
      rows,
      30,
      (p) => p.x,
      (p) => p.y,
    );
    expect(result.length).toBe(30);
    expect(result[0]).toEqual(rows[0]);
    expect(result.at(-1)).toEqual(rows.at(-1));
    expect(result.some((p) => p.y === 1000)).toBe(true);
  });
  it('escapes csv and spreadsheet formulas', () => {
    expect(csvCell('=SUM(A1)')).toBe('"\'=SUM(A1)"');
    expect(csvCell('a"b')).toBe('"a""b"');
  });
});
