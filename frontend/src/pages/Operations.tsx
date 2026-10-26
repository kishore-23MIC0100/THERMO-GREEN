import { lazy, Suspense, useState } from 'react';
import { Activity, ShieldCheck, Download, Cpu, Timer, Workflow, Square } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  useRuntime,
  injectFault,
  pauseHeartbeat,
  resumeHeartbeat,
  setProfile,
  reportError,
} from '../stores/runtime';
import {
  SystemStatus,
  QuickControls,
  RecentEvents,
  WorkloadPanel,
  ConnectionBar,
} from '../components/DashboardPanels';
import { Badge, Metric, PanelHeading, useReading, Empty } from '../components/primitives';
import { SAFETY } from '../lib/config';
import { db } from '../db/database';
import { download, sessionCSV } from '../analytics/export';
import { metrics } from '../analytics/metrics';
import { useSettings } from '../stores/settings';
import { useCompute } from '../compute/store';
const Chart = lazy(() => import('../components/Charts'));
export function PageTitle({ title, description }: { title: string; description: string }) {
  return (
    <header className="page-title">
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}
export function Monitor() {
  const s = useRuntime();
  const [paused, setPaused] = useState(false),
    [windowMs, setWindowMs] = useState(60000);
  const samples = s.samples.filter(
    (p) => p.timestamp >= (s.samples.at(-1)?.timestamp ?? 0) - windowMs,
  );
  return (
    <>
      <PageTitle
        title="Live Monitoring"
        description="Validated, timestamped sensor data. Gaps are preserved when the stream is interrupted."
      />
      <div className="toolbar">
        <ConnectionBar />
        <label>
          Time window
          <select value={windowMs} onChange={(e) => setWindowMs(Number(e.target.value))}>
            <option value={60000}>1 minute</option>
            <option value={300000}>5 minutes</option>
            <option value={3600000}>1 hour</option>
          </select>
        </label>
        <button onClick={() => setPaused(!paused)}>
          {paused ? 'Resume charts' : 'Pause charts'}
        </button>
        <button
          disabled={!s.sessionId}
          onClick={() => {
            if (s.sessionId)
              void sessionCSV(s.sessionId)
                .then((text) => download(text, 'telemetry.csv'))
                .catch(reportError);
          }}
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      <div className="two-columns">
        <section className="panel">
          <PanelHeading icon={Activity} title="Reactor temperature" />
          <Suspense fallback={<div className="chart-skeleton" />}>
            <Chart samples={samples} paused={paused} />
          </Suspense>
        </section>
        <SystemStatus />
        <section className="panel">
          <PanelHeading icon={Activity} title="Relative gas sensor" />
          <Suspense>
            <Chart samples={samples} kind="gas" paused={paused} />
          </Suspense>
        </section>
        <section className="panel">
          <PanelHeading icon={Square} title="Reported relay state" />
          <Suspense>
            <Chart samples={samples} kind="heater" paused={paused} />
          </Suspense>
        </section>
      </div>
    </>
  );
}
export function Controls() {
  const s = useRuntime();
  return (
    <>
      <PageTitle
        title="Hardware Controls"
        description="The laptop requests workload. The ESP32 retains autonomous authority over the heater."
      />
      <ConnectionBar />
      <div className="two-columns">
        <QuickControls />
        <section className="panel">
          <PanelHeading icon={ShieldCheck} title="Independent safety chain" />
          <div className="panel-body">
            <dl className="definition-list">
              <dt>Thermal trip</dt>
              <dd>{SAFETY.tripC} °C · latched</dd>
              <dt>Reset threshold</dt>
              <dd>Below {SAFETY.tripC - SAFETY.resetMarginC} °C</dd>
              <dt>Link watchdog</dt>
              <dd>Heartbeat absent for more than 3 s</dd>
              <dt>Sensor validation</dt>
              <dd>Disconnected, 85 °C, NaN, stale conversion</dd>
              <dt>Relay protection</dt>
              <dd>Minimum 5 s dwell; safety OFF is immediate</dd>
              <dt>Pump</dt>
              <dd>Always powered externally; no software toggle</dd>
            </dl>
            <p className="warning-text">
              An offline browser cannot send an OFF command. Firmware protection and physical power
              isolation remain essential.
            </p>
            <label>
              Workload profile
              <select
                value={s.profile}
                disabled={!['LIVE', 'SIMULATED'].includes(s.mode)}
                onChange={(e) => setProfile(e.target.value as typeof s.profile)}
              >
                {['IDLE', 'INFERENCE', 'TRAINING', 'CUSTOM'].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <p>
              INFERENCE requests 9 s per 30 s. TRAINING requests sustained heat. Temperature gating
              and safety remain active.
            </p>
          </div>
        </section>
      </div>
      {s.mode === 'SIMULATED' && (
        <section className="panel scenario-panel">
          <PanelHeading
            icon={ShieldCheck}
            title="Simulation safety scenarios"
            subtitle="Fault injection affects the simulator only"
          />
          <div className="button-row">
            <button onClick={() => injectFault('thermal')}>Inject thermal trip</button>
            <button onClick={() => injectFault('sensor')}>Disconnect virtual sensor</button>
            <button onClick={s.heartbeatPaused ? resumeHeartbeat : pauseHeartbeat}>
              {s.heartbeatPaused ? 'Resume heartbeat' : 'Pause heartbeat'}
            </button>
            <button onClick={() => injectFault('recover')}>Restore sensor & cool down</button>
          </div>
          <p>
            Restore the condition, resume heartbeat, then use Reset latched fault. The heater stays
            OFF until another request.
          </p>
        </section>
      )}
      <section className="panel">
        <PanelHeading icon={Activity} title="Command acknowledgements" />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Request</th>
                <th>Time</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {s.commands.map((c) => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td>{c.label}</td>
                  <td>{new Date(c.at).toLocaleTimeString()}</td>
                  <td>
                    <Badge claim={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!s.commands.length && <Empty title="No commands sent" />}
        </div>
      </section>
      <RecentEvents full />
    </>
  );
}
export function Analytics() {
  const s = useRuntime(),
    settings = useSettings();
  const sessions =
    useLiveQuery(() => db.sessions.orderBy('startedAt').reverse().toArray(), []) ?? [];
  const [selected, setSelected] = useState('');
  const id = selected || s.sessionId;
  const stored =
    useLiveQuery<import('../db/database').Sample[]>(
      () =>
        id ? db.samples.where('sessionId').equals(id).sortBy('timestamp') : Promise.resolve([]),
      [id, s.samples.length],
    ) ?? [];
  const m = metrics(stored, settings.massG, settings.cp, settings.high);
  const simulated = stored.some((p) => p.source === 'simulated');
  return (
    <>
      <PageTitle
        title="Thermal Analytics"
        description="Calculations use recorded samples and explicit assumptions. They are not measurements of carbon capture."
      />
      <div className="toolbar">
        <label>
          Session
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Active session</option>
            {sessions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.source})
              </option>
            ))}
          </select>
        </label>
        <Badge claim={simulated ? 'SIMULATED' : 'CALCULATED'} />
      </div>
      <div className="metric-grid">
        <Metric
          label="Temperature change"
          value={m?.delta.toFixed(2) ?? null}
          unit="°C"
          claim="CALCULATED"
          detail="Last valid sample − first valid sample"
        />
        <Metric
          label="Sensible heat"
          value={m ? (m.energyJ / 1000).toFixed(2) : null}
          unit="kJ"
          claim="CALCULATED"
          detail={`Q = ${settings.massG} g × ${settings.cp} J/(g·°C) × ΔT`}
        />
        <Metric
          label="Heating rate"
          value={m?.rate?.toFixed(2) ?? null}
          unit="°C/min"
          claim="CALCULATED"
          detail="Linear fit over the last 60 s of recorded timestamps"
        />
        <Metric
          label="Relay duty"
          value={m?.duty.toFixed(1) ?? null}
          unit="%"
          claim="CALCULATED"
          detail="Time-weighted reported ON state; excludes gaps over 2 s"
        />
        <Metric
          label="Maximum reactor temperature"
          value={m?.max.toFixed(2) ?? null}
          unit="°C"
          claim="CALCULATED"
          detail="Maximum valid recorded reactor reading"
        />
        <Metric
          label="Time to operating ceiling"
          value={m?.timeToTarget?.toFixed(1) ?? null}
          unit="min"
          claim="ESTIMATED"
          detail="Linear extrapolation; no estimate when heating is flat or declining"
        />
      </div>
      <div className="two-columns">
        <section className="panel">
          <PanelHeading icon={Activity} title="Recorded thermal response" />
          <Suspense>
            <Chart samples={stored} />
          </Suspense>
        </section>
        <section className="panel">
          <PanelHeading icon={Timer} title="Calculation assumptions" />
          <div className="panel-body">
            <label>
              Water mass (g)
              <input
                type="number"
                min="1"
                max="10000"
                value={settings.massG}
                onChange={(e) => settings.update({ massG: Math.max(1, Number(e.target.value)) })}
              />
            </label>
            <label>
              Specific heat (J/g·°C)
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.001"
                value={settings.cp}
                onChange={(e) => settings.update({ cp: Math.max(0.1, Number(e.target.value)) })}
              />
            </label>
            <p>
              Baseline: approximately 80 g loop water + 250 g reactor water; heat capacity ≈1,380
              J/°C. A nominal 40 W heater gives ≤1.7 °C/min ideally. Blocks and losses slow actual
              warming.
            </p>
            <p>
              {simulated
                ? 'These samples are simulated. Accelerated simulation rates use wall-clock timestamps and must not be treated as physical heating rates.'
                : 'Actual heater power and coolant flow are not instrumented.'}
            </p>
            <Metric
              label="Thermal trips"
              value={m?.trips ?? null}
              claim="CALCULATED"
              detail="Rising edges of the recorded thermal-trip flag"
            />
          </div>
        </section>
      </div>
    </>
  );
}
export function Compute() {
  const c = useCompute(),
    s = useReading();
  return (
    <>
      <PageTitle
        title="Data Centre Workload Demo"
        description="Run actual numerical inference or training on this laptop. The heater represents the thermal output of a workload."
      />
      <div className="two-columns">
        <WorkloadPanel expanded />
        <section className="panel">
          <PanelHeading icon={Workflow} title="Transparent demonstration flow" />
          <ol className="process-flow">
            <li>
              <strong>Queue compute</strong>
              <p>Choose a local attention forward pass or gradient descent training.</p>
            </li>
            <li>
              <strong>Process actual jobs</strong>
              <p>A Web Worker performs numerical operations and records wall-clock timing.</p>
            </li>
            <li>
              <strong>Request a thermal workload</strong>
              <p>
                Optional explicit coupling: load / 100 sets duty demand. This is a simulated heat
                mapping.
              </p>
            </li>
            <li>
              <strong>Apply safety gates</strong>
              <p>
                Hysteresis, fresh telemetry, minimum dwell, and firmware interlocks decide whether
                heat is permitted.
              </p>
            </li>
          </ol>
        </section>
      </div>
      <div className="metric-grid">
        <Metric
          label="Completed jobs"
          value={c.stats?.jobs ?? null}
          claim="MEASURED"
          detail="Completed worker jobs on this laptop"
        />
        <Metric
          label="Throughput"
          value={c.stats?.throughput.toFixed(1) ?? null}
          unit="jobs/s"
          claim="CALCULATED"
          detail="Completed jobs / measured elapsed wall time"
        />
        <Metric
          label="Compute time"
          value={c.stats ? (c.stats.computeMs / 1000).toFixed(2) : null}
          unit="s"
          claim="MEASURED"
          detail="Accumulated worker execution time from performance.now()"
        />
        <Metric
          label="Model output checksum"
          value={c.stats?.checksum.toFixed(6) ?? null}
          claim="CALCULATED"
          detail="Sum of attention outputs, or learned weight for training"
        />
        <Metric
          label="Training loss"
          value={c.stats?.loss?.toExponential(3) ?? null}
          claim="CALCULATED"
          detail="Mean squared error on synthetic y = 2x data"
        />
        <Metric
          label="Reactor temperature"
          value={s.telemetry?.temp?.toFixed(2) ?? null}
          unit="°C"
          claim={s.claim}
          detail="Comes from the separately selected telemetry source"
        />
      </div>
      <section className="panel">
        <PanelHeading icon={Cpu} title="What is actually running?" />
        <div className="panel-body">
          <p>
            <strong>Inference:</strong> a 32-token, 32-channel single-head attention layer. Q, K, V
            projections, scaled dot-product attention, softmax, and weighted-value output execute
            for each job. Weights are deterministic and synthetic; this is not a pretrained language
            model.
          </p>
          <p>
            <strong>Training:</strong> gradient descent updates a scalar regression model against
            128 synthetic y = 2x examples. The visible loss and learned coefficient come from these
            calculations.
          </p>
          <p>
            Both are genuine compute demonstrations. Neither represents a remote data centre,
            measured electrical power, calibrated CPU utilization, or measured carbon savings. For
            real language generation, configure the local Ollama assistant.
          </p>
        </div>
      </section>
      {c.error && <p role="alert">{c.error}</p>}
    </>
  );
}
