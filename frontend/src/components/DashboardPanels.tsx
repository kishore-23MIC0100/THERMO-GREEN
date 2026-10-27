import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Thermometer,
  Flame,
  Droplets,
  Wind,
  Cpu,
  FlaskConical,
  Leaf,
  Settings2,
  Bell,
  Play,
  Square,
  Usb,
  ShieldAlert,
} from 'lucide-react';
import { Badge, PanelHeading, useReading, tempDisplay, Confirm, Empty } from './primitives';
import { Sparkline } from './Charts';
import { SAFETY, faultNames } from '../lib/config';
import { connectionStatus } from '../lib/connection-status';
import {
  useRuntime,
  connect,
  disconnect,
  canHeat,
  issue,
  emergencyStop,
  isResettable,
  resetBlockReason,
} from '../stores/runtime';
import { useSettings } from '../stores/settings';
import { faultDetails } from '../hardware/diagnostics';
import { HeaterPower } from './HeaterPower';
import { useCompute, configureCompute, runCompute, stopCompute } from '../compute/store';
const TelemetryChart = lazy(() => import('./Charts'));
export function stopAll() {
  stopCompute();
  configureCompute({ linked: false });
  void emergencyStop();
}
export function SystemStatus() {
  const s = useReading(),
    t = s.telemetry;
  const trend = s.samples.slice(-25);
  return (
    <section className="panel system-panel">
      <PanelHeading icon={Activity} title="System Status" />
      <div className="status-summary">
        <Badge claim={connectionStatus(s)} />
        <span>
          {s.mode === 'LIVE'
            ? s.telemetry
              ? 'ESP32 via USB Serial (115200 baud)'
              : 'USB selected · waiting for valid sensor data'
            : s.mode === 'SIMULATED'
              ? 'Thermal model worker'
              : s.mode === 'REPLAY'
                ? 'Recorded session playback'
                : 'No device connected'}
        </span>
      </div>
      <p className="last-update">
        Last update:{' '}
        <time>{s.receivedAt ? new Date(s.receivedAt).toLocaleTimeString() : 'Unavailable'}</time>
        <span>{s.stale && s.available ? 'STALE' : s.age}</span>
      </p>
      <div className="status-stack">
        <div className="status-card">
          <span className="status-icon orange">
            <Thermometer />
          </span>
          <div>
            <span>Reactor Temperature</span>
            <strong className="emerald">{tempDisplay(t?.temp, s.units)}</strong>
            <small>Trip limit: {SAFETY.tripC} °C</small>
            <Badge claim={t?.temp == null ? 'UNAVAILABLE' : s.claim} />
          </div>
          <Sparkline values={trend.flatMap((p) => (p.temp == null ? [] : [p.temp]))} />
        </div>
        <div className="status-card">
          <span className="status-icon orange">
            <Flame />
          </span>
          <div>
            <span>Heater Status</span>
            <strong className={t?.heater ? 'orange' : ''}>
              {t ? (t.heater ? 'ON' : 'OFF') : 'UNKNOWN'}
            </strong>
            <small>Firmware-reported relay state</small>
            <Badge claim={s.claim} />
          </div>
          <Sparkline values={trend.map((p) => p.heater)} color="#ff8a3d" />
        </div>
        <div className="status-card">
          <span className="status-icon cyan">
            <Droplets />
          </span>
          <div>
            <span>Pump Status</span>
            <strong className="cyan small-value">Not instrumented</strong>
            <small>12 V direct · no software control</small>
            <Badge claim="UNAVAILABLE" />
          </div>
        </div>
        <div className="status-card">
          <span className="status-icon emerald">
            <Wind />
          </span>
          <div>
            <span>Gas Sensor (MQ-135)</span>
            <strong className="emerald">{t?.gas ?? 'Unavailable'}</strong>
            <small>Raw ADC · not CO₂ ppm</small>
            <Badge claim={s.claim} />
          </div>
          <Sparkline values={trend.map((p) => p.gas)} color="#00e5a0" />
        </div>
      </div>
    </section>
  );
}
export function WorkloadPanel({ expanded = false }: { expanded?: boolean }) {
  const c = useCompute(),
    s = useRuntime();
  return (
    <section className={`panel workload-panel ${expanded ? 'wide' : ''}`}>
      <PanelHeading
        icon={Cpu}
        title={expanded ? 'Compute demonstration' : 'Simulated AI Workload'}
        subtitle="Real local jobs → simulated heater demand"
        action={
          !expanded ? (
            <Link className="text-link" to="/compute">
              Inspect
            </Link>
          ) : undefined
        }
      />
      <div className="workload-body">
        <div className="load-range">
          <label className="sr-only" htmlFor={expanded ? 'load-expanded' : 'load-dashboard'}>
            Requested workload percent
          </label>
          <input
            id={expanded ? 'load-expanded' : 'load-dashboard'}
            type="range"
            min="0"
            max="100"
            value={c.load}
            onChange={(e) => configureCompute({ load: Number(e.target.value) })}
          />
          <output>{c.load}%</output>
        </div>
        <div className="workload-bottom">
          <div>
            <div className="preset-row">
              {[
                ['Low', 20],
                ['Medium', 50],
                ['High', 90],
              ].map(([name, value]) => (
                <button
                  key={name}
                  className={c.load === value ? 'active' : ''}
                  onClick={() => configureCompute({ load: Number(value) })}
                >
                  {name}
                </button>
              ))}
              <button
                className={s.auto ? 'active' : ''}
                disabled={!canHeat()}
                onClick={() => {
                  configureCompute({ linked: !c.linked });
                }}
              >
                Auto
              </button>
            </div>
            <div className="button-row">
              <button
                className={c.running ? '' : 'primary'}
                onClick={() => (c.running ? stopCompute() : runCompute())}
              >
                {c.running ? <Square size={14} /> : <Play size={14} />}{' '}
                {c.running ? 'Stop compute' : 'Run compute'}
              </button>
              <span className="compute-count">
                {c.stats ? `${c.stats.jobs.toLocaleString()} jobs` : 'Ready to process'}
              </span>
            </div>
          </div>
          <div
            className="activity-bars"
            role="img"
            aria-label={c.running ? 'Measured compute activity' : 'No compute activity'}
          >
            {Array.from({ length: 12 }, (_, i) => {
              const v = c.history[Math.max(0, c.history.length - 12) + i];
              return (
                <i
                  key={i}
                  style={{
                    height: v ? `${Math.max(5, (v / Math.max(...c.history)) * 100)}%` : '4%',
                    opacity: v ? 1 : 0.15,
                  }}
                />
              );
            })}
          </div>
        </div>
        <p className="microcopy">
          Requested load, not measured CPU utilization. <Badge claim="SIMULATED" />
        </p>
      </div>
      {expanded && (
        <div className="panel-body">
          <label>
            Job type
            <select
              value={c.kind}
              disabled={c.running}
              onChange={(e) =>
                configureCompute({ kind: e.target.value as 'inference' | 'training' })
              }
            >
              <option value="inference">Attention-model inference</option>
              <option value="training">Gradient descent training</option>
            </select>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={c.linked}
              disabled={!canHeat() && !c.linked}
              onChange={(e) => configureCompute({ linked: e.target.checked })}
            />
            Link compute workload to heater demand
          </label>
          <p>
            Mapping: requested workload / 100 = duty demand in a 30 s period. Fresh telemetry,
            hysteresis, dwell protection, and firmware interlocks gate every command. Compute runs
            on this laptop; the PTC plate represents its waste heat.
          </p>
        </div>
      )}
    </section>
  );
}
export function TrendPanel({ gas = false }: { gas?: boolean }) {
  const s = useReading();
  return (
    <section className="panel trend-panel">
      <PanelHeading
        icon={gas ? Wind : Thermometer}
        title={gas ? 'Gas Sensor Trend' : 'Live Temperature (°C)'}
        subtitle={gas ? 'MQ-135 · relative raw ADC' : 'Reactor sensor · time-stamped samples'}
        action={<Badge claim={s.claim} />}
      />
      <Suspense fallback={<div className="chart-skeleton" />}>
        <TelemetryChart samples={s.samples} compact kind={gas ? 'gas' : 'temperature'} />
      </Suspense>
    </section>
  );
}
export function ReactorModes() {
  return (
    <section className="panel">
      <PanelHeading
        icon={FlaskConical}
        title="Reactor Mode"
        subtitle="Select the experimental workspace"
      />
      <div className="reactor-modes">
        <Link className="reactor-option selected" to="/twin">
          <Thermometer />
          <strong>
            Thermal Demo<small>Current prototype</small>
          </strong>
          <p>Simulated AI heat + temperature control</p>
        </Link>
        <Link className="reactor-option" to="/chemistry">
          <FlaskConical />
          <strong>
            Chemical Mode<small>Research protocol</small>
          </strong>
          <p>Calcium hydroxide CO₂ mineralization</p>
        </Link>
        <Link className="reactor-option" to="/algae">
          <Leaf />
          <strong>
            Biological Mode<small>Planned</small>
          </strong>
          <p>Spirulina cultivation with illumination</p>
        </Link>
      </div>
    </section>
  );
}
export function QuickControls() {
  const s = useRuntime(),
    settings = useSettings();
  const [target, setTarget] = useState(settings.requestedTargetC),
    [confirm, setConfirm] = useState(false);
  const online = ['LIVE', 'SIMULATED'].includes(s.mode),
    pending = s.commands.some((c) => c.status === 'pending');
  return (
    <section className="panel">
      <PanelHeading icon={Settings2} title="Quick Controls" />
      <div className="panel-body controls-body">
        <HeaterPower />
        <label>
          Requested target (25–50 °C)
          <div className="inline-field">
            <input
              aria-label="Requested target in Celsius"
              type="number"
              min="25"
              max="50"
              step="0.5"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
            />
            <button
              onClick={() => {
                const requested = Math.max(25, Math.min(50, Number.isFinite(target) ? target : 35));
                const effective = Math.min(requested, SAFETY.tripC - SAFETY.setpointMarginC);
                settings.update({
                  requestedTargetC: requested,
                  high: effective,
                  low: effective - 3,
                });
                setTarget(requested);
              }}
            >
              Apply
            </button>
          </div>
        </label>
        <small>
          Applied ceiling: {settings.high.toFixed(1)} °C · Firmware trip: {SAFETY.tripC} °C.
          {settings.requestedTargetC > settings.high &&
            ' Higher requests are limited by the current hardware safety configuration.'}
        </small>
        {s.telemetry?.armed === false && (
          <p className="warning-text">
            Relay safety lock is enabled (armed=false). Sensor monitoring and safe fault reset
            remain available. Heater activation stays blocked until physical relay verification and
            an approved firmware update.
          </p>
        )}
        {s.telemetry?.fault ? (
          <>
            <button disabled={!isResettable() || pending} onClick={() => setConfirm(true)}>
              Reset latched fault
            </button>
            <small>
              {resetBlockReason() ??
                'Ready for operator-confirmed reset. Reset keeps the heater OFF and preserves the relay verification lock.'}
            </small>
          </>
        ) : null}
        <p className="command-result" aria-live="polite">
          {s.commands[0]
            ? `#${s.commands[0].id} ${s.commands[0].label}: ${s.commands[0].status}`
            : online
              ? 'Awaiting a control request'
              : 'Connect a source to enable controls'}
        </p>
      </div>
      {confirm && (
        <Confirm
          title="Reset the safety latch?"
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            setConfirm(false);
            configureCompute({ linked: false });
            useRuntime.setState({ auto: false, profile: 'IDLE', burstUntil: 0 });
            void issue({ cmd: 'reset_fault' });
          }}
        >
          <p>
            Confirm the fault cause is resolved, circulation is physically checked, and both
            available probes are below {SAFETY.tripC - SAFETY.resetMarginC} °C. Reset leaves the
            heater OFF.
          </p>
        </Confirm>
      )}
    </section>
  );
}
export function RecentEvents({ full = false }: { full?: boolean }) {
  const events = useRuntime((s) => s.events);
  const [clearedAt, setClearedAt] = useState(0),
    [filter, setFilter] = useState('all');
  const visible = events.filter(
    (e) => e.timestamp > clearedAt && (filter === 'all' || e.kind === filter),
  );
  return (
    <section className="panel">
      <PanelHeading
        icon={Bell}
        title="Recent Events"
        subtitle="Timestamped session events"
        action={<button onClick={() => setClearedAt(Date.now())}>Clear view</button>}
      />
      {full && (
        <label className="panel-body">
          Filter event type
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {['all', 'system', 'command', 'ack', 'fault', 'error'].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
      )}
      <div className={`event-list ${full ? 'full' : ''}`}>
        {visible.length ? (
          visible.slice(0, full ? 200 : 7).map((e, i) => (
            <div className={`event-row ${e.kind}`} key={`${e.timestamp}-${i}`}>
              <i />
              <time>{new Date(e.timestamp).toLocaleTimeString()}</time>
              <span title={e.message}>{e.message}</span>
            </div>
          ))
        ) : (
          <Empty title="No events yet">
            <p>Connect a source to begin recording.</p>
          </Empty>
        )}
      </div>
    </section>
  );
}
export function ConnectionBar() {
  const s = useRuntime();
  return (
    <div className="connection-actions">
      {s.mode === 'DISCONNECTED' ? (
        <>
          <button className="primary" disabled={s.busy} onClick={() => void connect('LIVE')}>
            <Usb size={16} />
            {s.busy ? 'Connecting…' : 'Connect ESP32'}
          </button>
          <button disabled={s.busy} onClick={() => void connect('SIMULATED')}>
            Start simulation
          </button>
        </>
      ) : (
        <button
          onClick={() => {
            stopCompute();
            void disconnect();
          }}
        >
          Disconnect {s.mode === 'REPLAY' ? 'replay' : 'source'}
        </button>
      )}
    </div>
  );
}
export function FaultBanner() {
  const s = useRuntime();
  if (!s.telemetry?.fault) return null;
  return (
    <div className="fault-banner" role="alert">
      <ShieldAlert size={22} />
      <div>
        <strong>Safety interlock: {faultNames(s.telemetry.fault).join(' + ')}</strong>
        <span>
          Heater reported {s.telemetry.heater ? 'ON: inspect immediately' : 'OFF'}. Resolve the
          cause and explicitly reset after cooldown.
        </span>
        {faultDetails(s.telemetry, !!s.receivedAt && s.now - s.receivedAt <= SAFETY.staleMs).map(
          (detail) => (
            <p className="fault-detail" key={detail.name}>
              <b>{detail.name}:</b> {detail.explanation}
            </p>
          ),
        )}
        {s.telemetry.reportedFault != null && s.telemetry.reportedFault !== s.telemetry.fault && (
          <p className="fault-detail">
            Device-reported mask: {s.telemetry.reportedFault}. Browser validation also detected an
            invalid probe reading.
          </p>
        )}
      </div>
      <Link to="/control">Inspect fault</Link>
    </div>
  );
}
