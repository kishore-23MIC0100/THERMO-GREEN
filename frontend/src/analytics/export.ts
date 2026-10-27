import { db } from '../db/database';
import { csvCell } from './metrics';
export async function sessionCSV(id: string) {
  const session = await db.sessions.get(id);
  if (!session) throw new Error('Session not found');
  const [samples, notes] = await Promise.all([
    db.samples.where('sessionId').equals(id).sortBy('timestamp'),
    db.notes.where('sessionId').equals(id).toArray(),
  ]);
  return [
    '# AlgaeRhythm session export',
    ...Object.entries({ ...session, annotations: notes.map((n) => n.text).join(' | ') }).map(
      ([key, value]) => `# ${key},${csvCell(value)}`,
    ),
    'timestamp_iso,temp_C,temp2_C,gas_raw_ADC,heater_commanded,fault_bitmask,source,seq,device_reported_fault,browser_sensor_invalid',
    ...samples.map((s) =>
      [
        new Date(s.timestamp).toISOString(),
        s.temp,
        s.temp2,
        s.gas,
        s.heater,
        s.fault,
        s.source,
        s.seq,
        s.reportedFault ?? s.fault,
        s.sensorInvalid ?? '',
      ]
        .map(csvCell)
        .join(','),
    ),
  ].join('\n');
}
export function download(text: string, name: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
