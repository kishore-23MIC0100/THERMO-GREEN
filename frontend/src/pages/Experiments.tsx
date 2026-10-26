import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { NotebookPen, Download, Play, GitCompare, FileText } from 'lucide-react';
import { db, type Session } from '../db/database';
import { useRuntime, replay, reportError, connect } from '../stores/runtime';
import { Badge, Empty, PanelHeading } from '../components/primitives';
import { download, sessionCSV } from '../analytics/export';
import { PageTitle } from './Operations';
const Chart = lazy(() => import('../components/Charts'));
function SessionEditor({ session }: { session: Session }) {
  const [name, setName] = useState(session.name),
    [note, setNote] = useState(''),
    [saved, setSaved] = useState('');
  const notes =
    useLiveQuery(() => db.notes.where('sessionId').equals(session.id).toArray(), [session.id]) ??
    [];
  return (
    <div className="panel-body">
      <label>
        Experiment name
        <input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
      </label>
      <button
        onClick={() =>
          void db.sessions
            .update(session.id, { name: name.trim() || session.name })
            .then(() => setSaved('Experiment renamed'))
            .catch(reportError)
        }
      >
        Save name
      </button>
      <label>
        Objective / annotation
        <textarea
          value={note}
          maxLength={4000}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Record the experiment objective, setup, and observations."
        />
      </label>
      <button
        disabled={!note.trim()}
        onClick={() =>
          void db.notes
            .add({ sessionId: session.id, text: note.trim(), timestamp: Date.now() })
            .then(() => {
              setNote('');
              setSaved('Annotation saved');
            })
            .catch(reportError)
        }
      >
        Add annotation
      </button>
      <small aria-live="polite">{saved}</small>
      {notes.map((n) => (
        <blockquote key={n.id}>
          <time>{new Date(n.timestamp).toLocaleString()}</time>
          <p>{n.text}</p>
        </blockquote>
      ))}
    </div>
  );
}
export default function Experiments() {
  const navigate = useNavigate(),
    active = useRuntime((s) => s.sessionId);
  const sessions =
    useLiveQuery(() => db.sessions.orderBy('startedAt').reverse().toArray(), []) ?? [];
  const [selected, setSelected] = useState<string>(''),
    [a, setA] = useState(''),
    [b, setB] = useState('');
  const selectedSession = sessions.find((s) => s.id === selected);
  const compareA =
    useLiveQuery<import('../db/database').Sample[]>(
      () => (a ? db.samples.where('sessionId').equals(a).sortBy('timestamp') : Promise.resolve([])),
      [a],
    ) ?? [];
  const compareB =
    useLiveQuery<import('../db/database').Sample[]>(
      () => (b ? db.samples.where('sessionId').equals(b).sortBy('timestamp') : Promise.resolve([])),
      [b],
    ) ?? [];
  return (
    <>
      <PageTitle
        title="Experiments"
        description="Sessions are recorded in this browser's IndexedDB. Export scientific records before clearing browser storage."
      />
      <div className="toolbar">
        <button onClick={() => void connect('SIMULATED')}>New simulated experiment</button>
        <button onClick={() => void connect('LIVE')}>New hardware experiment</button>
        <span>Starting a new experiment safely closes the previous source.</span>
      </div>
      <section className="panel">
        <PanelHeading icon={NotebookPen} title="Recorded sessions" />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Experiment</th>
                <th>Source</th>
                <th>Started</th>
                <th>State</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <button className="text-link" onClick={() => setSelected(s.id)}>
                      {s.name}
                    </button>
                  </td>
                  <td>
                    <Badge claim={s.source.toUpperCase()} />
                  </td>
                  <td>{new Date(s.startedAt).toLocaleString()}</td>
                  <td>
                    {active === s.id && !s.endedAt
                      ? 'Recording'
                      : s.endedAt
                        ? 'Completed'
                        : 'Interrupted'}
                  </td>
                  <td>
                    <div className="button-row">
                      <button
                        aria-label={`Export ${s.name}`}
                        onClick={() =>
                          void sessionCSV(s.id)
                            .then((csv) => download(csv, `algaerhythm-${s.id}.csv`))
                            .catch(reportError)
                        }
                      >
                        <Download size={16} />
                      </button>
                      <button
                        aria-label={`Replay ${s.name}`}
                        onClick={() =>
                          void replay(s.id)
                            .then(() => navigate('/'))
                            .catch(reportError)
                        }
                      >
                        <Play size={16} />
                        Replay
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!sessions.length && (
            <Empty title="No recorded experiments">
              <p>
                Start a simulated or hardware experiment. Every validated sample and event is saved
                locally.
              </p>
            </Empty>
          )}
        </div>
      </section>
      {selectedSession && (
        <section className="panel">
          <PanelHeading
            icon={FileText}
            title="Experiment notebook"
            subtitle={`Firmware ${selectedSession.firmware} · trip ${selectedSession.tripC} °C`}
          />
          <SessionEditor session={selectedSession} key={selectedSession.id} />
        </section>
      )}
      <section className="panel">
        <PanelHeading
          icon={GitCompare}
          title="Compare experiments"
          subtitle="Overlay runs from a common elapsed-time origin"
        />
        <div className="toolbar">
          {[
            [a, setA, 'First experiment'],
            [b, setB, 'Second experiment'],
          ].map(([value, setter, label]) => (
            <label key={String(label)}>
              {String(label)}
              <select
                value={value as string}
                onChange={(e) => (setter as (s: string) => void)(e.target.value)}
              >
                <option value="">Choose a session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.source})
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {a && b ? (
          <Suspense>
            <Chart
              samples={compareA}
              compare={{
                samples: compareB,
                name: sessions.find((s) => s.id === b)?.name ?? 'Comparison',
              }}
            />
          </Suspense>
        ) : (
          <Empty title="Select two recorded runs">
            <p>Use an ambient control and heated run for a meaningful comparison.</p>
          </Empty>
        )}
      </section>
    </>
  );
}
