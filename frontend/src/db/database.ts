import Dexie, { type EntityTable } from 'dexie';
import type { Telemetry } from '../hardware/protocol';
import type { Source } from '../lib/config';
export interface Session {
  id: string;
  name: string;
  startedAt: number;
  endedAt?: number;
  source: Source;
  firmware: string;
  tripC: number;
  notes: string;
  simSpeed?: number;
}
export interface Sample extends Telemetry {
  id?: number;
  sessionId: string;
  timestamp: number;
  source: Source;
}
export interface Event {
  id?: number;
  sessionId: string;
  timestamp: number;
  kind: 'command' | 'ack' | 'fault' | 'system' | 'error';
  message: string;
}
export interface Note {
  id?: number;
  sessionId: string;
  timestamp: number;
  text: string;
}
export interface ChemistryResult {
  id?: number;
  name: string;
  condition: 'ambient' | 'heated';
  precipitateG: number;
  blankG: number;
  method: string;
  timestamp: number;
}
export const db = new Dexie('algaerhythm-v1') as Dexie & {
  sessions: EntityTable<Session, 'id'>;
  samples: EntityTable<Sample, 'id'>;
  events: EntityTable<Event, 'id'>;
  notes: EntityTable<Note, 'id'>;
  chemistry: EntityTable<ChemistryResult, 'id'>;
};
db.version(1).stores({
  sessions: 'id,startedAt,source',
  samples: '++id,sessionId,[sessionId+timestamp]',
  events: '++id,sessionId,timestamp',
  notes: '++id,sessionId',
  chemistry: '++id,timestamp,condition',
});
