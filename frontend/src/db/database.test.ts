import { it, expect, afterEach } from 'vitest';
import { db } from './database';
import { sessionCSV } from '../analytics/export';
afterEach(async () => {
  await Promise.all([db.samples.clear(), db.sessions.clear(), db.notes.clear()]);
});
it('round-trips local sessions with source provenance and export metadata', async () => {
  await db.sessions.add({
    id: 's1',
    name: '=unsafe formula',
    startedAt: 1000,
    source: 'simulated',
    firmware: 'test',
    tripC: 35.5,
    notes: '',
    simSpeed: 10,
  });
  await db.samples.add({
    sessionId: 's1',
    timestamp: 1000,
    source: 'simulated',
    temp: 28,
    temp2: null,
    gas: 1800,
    heater: 0,
    fault: 0,
  });
  await db.notes.add({ sessionId: 's1', timestamp: 1000, text: 'Control run' });
  const output = await sessionCSV('s1');
  expect(output).toContain('"simulated"');
  expect(output).toContain('temp_C');
  expect(output).toContain('simSpeed');
  expect(output).toContain('Control run');
  expect(output).toContain("'=unsafe formula");
  expect((await db.samples.where('sessionId').equals('s1').toArray())[0].temp).toBe(28);
});
