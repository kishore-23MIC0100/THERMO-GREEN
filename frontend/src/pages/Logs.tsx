import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { FileText, Download } from 'lucide-react';
import { db } from '../db/database';
import { useRuntime, reportError } from '../stores/runtime';
import { download, sessionCSV } from '../analytics/export';
import { Badge, PanelHeading } from '../components/primitives';
import { PageTitle } from './Operations';
import { faultNames } from '../lib/config';
export default function Logs() {
  const runtime = useRuntime();
  const sessions =
    useLiveQuery(() => db.sessions.orderBy('startedAt').reverse().toArray(), []) ?? [];
  const [chosen, setChosen] = useState(''),
    [filter, setFilter] = useState('all');
  const id = chosen || runtime.sessionId || sessions[0]?.id;
  const samples =
    useLiveQuery<import('../db/database').Sample[]>(
      () =>
        id
          ? db.samples.where('sessionId').equals(id).reverse().limit(200).toArray()
          : Promise.resolve([]),
      [id, runtime.samples.length],
    ) ?? [];
  const events =
    useLiveQuery<import('../db/database').Event[]>(
      () =>
        id ? db.events.where('sessionId').equals(id).reverse().toArray() : Promise.resolve([]),
      [id, runtime.events.length],
    ) ?? [];
  const visible = events.filter((e) => filter === 'all' || e.kind === filter);
  return (
    <>
      <PageTitle
        title="Data Logs"
        description="Raw validated telemetry and persisted events, with explicit source provenance."
      />
      <div className="toolbar record-toolbar">
        <label>
          Session
          <select value={chosen} onChange={(e) => setChosen(e.target.value)}>
            <option value="">
              {runtime.sessionId ? 'Current session' : 'Latest recorded session'}
            </option>
            {sessions.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={!id}
          onClick={() =>
            id &&
            void sessionCSV(id)
              .then((csv) => download(csv, 'telemetry.csv'))
              .catch(reportError)
          }
        >
          <Download size={16} />
          Telemetry CSV
        </button>
        <button
          disabled={!events.length}
          onClick={() =>
            download(JSON.stringify(events, null, 2), 'events.json', 'application/json')
          }
        >
          Export events JSON
        </button>
      </div>
      <section className="panel records-panel">
        <PanelHeading
          icon={FileText}
          title="Events"
          subtitle={`${visible.length} of ${events.length} recorded events`}
          action={
            <label className="compact-filter">
              Event filter
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                {['all', 'system', 'command', 'ack', 'fault', 'error'].map((v) => (
                  <option key={v} value={v}>
                    {v === 'all'
                      ? 'All events'
                      : v === 'ack'
                        ? 'Acknowledgements'
                        : v[0].toUpperCase() + v.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          }
        />
        <div
          className="table-wrap log-table"
          tabIndex={0}
          role="region"
          aria-label="Recorded events scroll area"
        >
          <table aria-label="Recorded events">
            <thead>
              <tr>
                <th>Time</th>
                <th>Kind</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.timestamp).toLocaleTimeString()}</td>
                  <td>
                    <span className={`event-kind ${e.kind}`}>
                      {e.kind === 'ack' ? 'Acknowledged' : e.kind}
                    </span>
                  </td>
                  <td>{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && <p className="panel-body">No recorded events for this selection.</p>}
        </div>
      </section>
      <section className="panel">
        <PanelHeading
          icon={FileText}
          title="Latest validated samples"
          subtitle="Up to 200 rows shown; exports include the complete session"
        />
        <div
          className="table-wrap log-table"
          tabIndex={0}
          role="region"
          aria-label="Telemetry samples scroll area"
        >
          <table aria-label="Validated telemetry samples">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Reactor °C</th>
                <th>Probe 2 °C</th>
                <th>Gas ADC</th>
                <th>Heater</th>
                <th>Fault</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.timestamp).toISOString()}</td>
                  <td>{s.temp?.toFixed(2) ?? 'Unavailable'}</td>
                  <td>{s.temp2?.toFixed(2) ?? 'Unavailable'}</td>
                  <td>{s.gas}</td>
                  <td>
                    <span
                      className={`session-state ${s.heater ? 'recording' : ''}`}
                      title="Firmware-reported output"
                    >
                      {s.heater ? 'ON' : 'OFF'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={s.fault ? 'event-kind fault' : 'session-state'}
                      title={faultNames(s.fault).join(', ')}
                    >
                      {s.fault ? `Fault ${s.fault}` : 'Clear'}
                    </span>
                  </td>
                  <td>
                    <Badge claim={s.source.toUpperCase()} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!samples.length && (
            <p className="panel-body">No recorded telemetry for this selection.</p>
          )}
        </div>
      </section>
    </>
  );
}
