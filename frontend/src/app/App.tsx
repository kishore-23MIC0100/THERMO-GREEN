import { lazy, Suspense, useEffect, useState } from 'react';
import { NavLink, Route, Routes, Link, useLocation } from 'react-router-dom';
import {
  Leaf,
  Home,
  Box,
  Activity,
  SlidersHorizontal,
  ChartNoAxesCombined,
  NotebookPen,
  FlaskConical,
  Bot,
  Cable,
  FileText,
  Settings,
  Usb,
  Power,
  Menu,
  X,
  ShieldAlert,
  Cpu,
  CircleHelp,
} from 'lucide-react';
import { useRuntime, startRuntime } from '../stores/runtime';
import { useSettings } from '../stores/settings';
import { disposeCompute } from '../compute/store';
import { Badge, ErrorBoundary } from '../components/primitives';
import { ConnectionBar, FaultBanner, stopAll } from '../components/DashboardPanels';
import { SAFETY } from '../lib/config';
import { connectionStatus } from '../lib/connection-status';
const Dashboard = lazy(() => import('../pages/Dashboard'));
import { TwinScene } from '../digital-twin/LazyTwin';
const Monitor = lazy(() => import('../pages/Operations').then((m) => ({ default: m.Monitor })));
const Controls = lazy(() => import('../pages/Operations').then((m) => ({ default: m.Controls })));
const Analytics = lazy(() => import('../pages/Operations').then((m) => ({ default: m.Analytics })));
const Compute = lazy(() => import('../pages/Operations').then((m) => ({ default: m.Compute })));
const Experiments = lazy(() => import('../pages/Experiments'));
const Modes = lazy(() => import('../pages/Research').then((m) => ({ default: m.Modes })));
const Chemistry = lazy(() => import('../pages/Research').then((m) => ({ default: m.Chemistry })));
const Algae = lazy(() => import('../pages/Research').then((m) => ({ default: m.Algae })));
const Assistant = lazy(() => import('../pages/Assistant'));
const Hardware = lazy(() => import('../pages/Hardware'));
const Logs = lazy(() => import('../pages/Logs'));
const SettingsPage = lazy(() => import('../pages/Settings'));
const About = lazy(() => import('../pages/About'));
const navigation = [
  ['/', 'Dashboard', Home],
  ['/twin', '3D Digital Twin', Box],
  ['/monitor', 'Live Monitoring', Activity],
  ['/control', 'Controls', SlidersHorizontal],
  ['/thermal', 'Analytics', ChartNoAxesCombined],
  ['/experiments', 'Experiments', NotebookPen],
  ['/modes', 'Reactor Modes', FlaskConical],
  ['/compute', 'Compute Demo', Cpu],
  ['/assistant', 'AI Assistant', Bot],
  ['/hardware', 'Hardware Setup', Cable],
  ['/logs', 'Data Logs', FileText],
  ['/settings', 'Settings', Settings],
] as const;
function Tour() {
  const settings = useSettings();
  const [step, setStep] = useState(0);
  const steps = [
    [
      'Choose your source',
      'Connect an ESP32 over USB, or start an unmistakably labelled simulation. No device is connected automatically.',
    ],
    [
      'Inspect the twin',
      'Orbit, zoom, switch to exploded view, and select components. Pump flow is illustrative because it is not instrumented.',
    ],
    [
      'Run the demonstration',
      'Compute Demo runs numerical inference or training locally. Explicitly enable coupling to request heat through safety gates.',
    ],
    [
      'Record the evidence',
      'Sessions are saved in this browser. Export CSV, add notes, compare runs, and replay the 3D twin from Experiments.',
    ],
  ];
  if (settings.tourDone) return null;
  return (
    <aside className="tour" aria-label="Guided tour">
      <div>
        <strong>
          {step + 1} / 4 · {steps[step][0]}
        </strong>
        <button aria-label="Skip guided tour" onClick={() => settings.update({ tourDone: true })}>
          <X size={15} />
        </button>
      </div>
      <p>{steps[step][1]}</p>
      <div className="button-row">
        <button onClick={() => settings.update({ tourDone: true })}>Skip tour</button>
        <button
          className="primary"
          onClick={() => (step === 3 ? settings.update({ tourDone: true }) : setStep(step + 1))}
        >
          {step === 3 ? 'Finish' : 'Next'}
        </button>
      </div>
    </aside>
  );
}
export default function App() {
  const s = useRuntime(),
    settings = useSettings();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    const stop = startRuntime();
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) useSettings.getState().update({ reducedMotion: true });
    return () => {
      stop();
      disposeCompute();
    };
  }, []);
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(settings.reducedMotion);
  }, [settings.reducedMotion]);
  const stale = s.mode !== 'REPLAY' && !!s.receivedAt && s.now - s.receivedAt > SAFETY.staleMs;
  const duration = s.telemetry?.uptime_ms;
  const uptime = duration == null ? '--:--:--' : new Date(duration).toISOString().slice(11, 19);
  const online = ['LIVE', 'SIMULATED'].includes(s.mode);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to workspace
      </a>
      <header className="topbar">
        <button
          className="mobile-menu"
          aria-label="Toggle navigation"
          onClick={() => setNavOpen(!navOpen)}
        >
          <Menu />
        </button>
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Leaf size={32} />
          </span>
          <span>
            <strong>AlgaeRhythm</strong>
            <small>Bio-Compute</small>
          </span>
        </Link>
        <span className="tagline">
          AI Waste Heat → Carbon Capture <small>Research pathway · capture not demonstrated</small>
        </span>
        <div className="header-status">
          <Badge claim={connectionStatus(s)} />
          <span>
            <Usb size={16} />
            {s.mode === 'LIVE'
              ? 'ESP32 (USB)'
              : s.mode === 'SIMULATED'
                ? 'Virtual device'
                : s.mode === 'REPLAY'
                  ? 'Session playback'
                  : 'USB disconnected'}
          </span>
        </div>
        <div className="uptime">
          <small>Device uptime</small>
          <strong>{uptime}</strong>
        </div>
        <button className="emergency" disabled={!online} onClick={stopAll}>
          <ShieldAlert size={18} />
          E-STOP
        </button>
        <div className="event-brand">
          <Leaf />
          <span>
            <strong>SUSTAINATHON 2026</strong>
            <small>VIT Vellore | 26–27 Oct 2026</small>
          </span>
        </div>
      </header>
      <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
        <nav aria-label="Main navigation">
          {navigation.map(([path, label, Icon]) => (
            <NavLink end={path === '/'} key={path} to={path}>
              <Icon size={21} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mode-select">
            <span>Project Mode</span>
            <button
              className={s.mode === 'LIVE' ? 'active' : ''}
              disabled={s.busy}
              onClick={() => {
                void import('../stores/runtime').then((m) => m.connect('LIVE'));
              }}
            >
              <Usb size={16} />
              Live Hardware
            </button>
            <button
              className={s.mode === 'SIMULATED' ? 'active' : ''}
              disabled={s.busy}
              onClick={() => {
                void import('../stores/runtime').then((m) => m.connect('SIMULATED'));
              }}
            >
              <Power size={16} />
              Simulation
            </button>
          </div>
          <Link to="/about" className="sidebar-brand">
            <Leaf size={33} />
            <span>
              <strong>AlgaeRhythm</strong>
              <small>
                v1.0.0
                <br />
                Thermal research, with evidence.
              </small>
            </span>
          </Link>
        </div>
      </aside>
      <main id="main" className="workspace">
        <FaultBanner />
        {s.error && (
          <div className="error-banner" role="alert">
            <span>{s.error}</span>
            <button aria-label="Dismiss error" onClick={() => useRuntime.setState({ error: null })}>
              <X size={16} />
            </button>
          </div>
        )}
        {s.mode === 'SIMULATED' && (
          <div className="source-banner simulated">
            SIMULATION — NO PHYSICAL DEVICE CONNECTED{' '}
            <span>Model time: {settings.simSpeed}× · all sensor values simulated</span>
          </div>
        )}
        {s.mode === 'REPLAY' && (
          <div className="source-banner replay">
            REPLAY — RECORDED SESSION · physical commands disabled
          </div>
        )}
        {stale && (
          <div className="warning-panel" role="status">
            STALE TELEMETRY · Last sample {((s.now - s.receivedAt) / 1000).toFixed(1)} s ago.
            Heating requests are disabled.
          </div>
        )}
        {s.mode === 'DISCONNECTED' && (
          <div className="offline-strip">
            <span>Disconnected · all device readings unavailable</span>
            <ConnectionBar />
          </div>
        )}
        <ErrorBoundary>
          <Suspense fallback={<div className="page-skeleton">Loading workspace…</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/twin" element={<TwinScene expanded />} />
              <Route path="/monitor" element={<Monitor />} />
              <Route path="/control" element={<Controls />} />
              <Route path="/thermal" element={<Analytics />} />
              <Route path="/compute" element={<Compute />} />
              <Route path="/experiments" element={<Experiments />} />
              <Route path="/modes" element={<Modes />} />
              <Route path="/chemistry" element={<Chemistry />} />
              <Route path="/algae" element={<Algae />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/hardware" element={<Hardware />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<About />} />
              <Route
                path="*"
                element={
                  <div className="empty">
                    <CircleHelp />
                    <h1>Workspace not found</h1>
                    <Link to="/">Return to dashboard</Link>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <footer className="workspace-footer">
          <span>Thermal Test Vehicle · 40 W nominal · power & flow not instrumented</span>
          <span>Trip {SAFETY.tripC} °C · ESP32 has final authority</span>
        </footer>
      </main>
      <Tour />
      {s.notice && (
        <div className="toast" role="status">
          <span>{s.notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => useRuntime.setState({ notice: null })}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
