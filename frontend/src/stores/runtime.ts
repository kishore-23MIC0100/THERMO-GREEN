import { create } from 'zustand';
import { db, type Event, type Sample } from '../db/database';
import { SAFETY, type Mode, type Source } from '../lib/config';
import { parseTelemetry, type Command, type Telemetry } from '../hardware/protocol';
import { SerialTransport, SimulatorTransport, type Transport } from '../hardware/serial';
import { decideHeater, demand, type Profile } from '../hardware/controller';
import { useSettings } from './settings';
import { validProbe } from '../hardware/diagnostics';

export interface Pending {
  id: number;
  label: string;
  at: number;
  status: 'pending' | 'acknowledged' | 'rejected' | 'timeout' | 'failed' | 'cancelled';
  value?: 0 | 1;
}
interface Runtime {
  mode: Mode;
  busy: boolean;
  transportReady: boolean;
  telemetry: Telemetry | null;
  receivedAt: number;
  now: number;
  sessionId: string | null;
  samples: Sample[];
  events: Event[];
  commands: Pending[];
  error: string | null;
  notice: string | null;
  profile: Profile;
  customDuty: number;
  auto: boolean;
  heartbeatPaused: boolean;
  replaySamples: Sample[];
  replayIndex: number;
  replayPlaying: boolean;
  burstUntil: number;
  lastChange: number;
  recordingError: boolean;
  heaterIntent: 0 | 1;
}
export const useRuntime = create<Runtime>(() => ({
  mode: 'DISCONNECTED',
  busy: false,
  transportReady: false,
  telemetry: null,
  receivedAt: 0,
  now: Date.now(),
  sessionId: null,
  samples: [],
  events: [],
  commands: [],
  error: null,
  notice: null,
  profile: 'IDLE',
  customDuty: 0.5,
  auto: false,
  heartbeatPaused: false,
  replaySamples: [],
  replayIndex: 0,
  replayPlaying: false,
  burstUntil: 0,
  lastChange: 0,
  recordingError: false,
  heaterIntent: 0,
}));
let transport: Transport | null = null;
let counter = 1;
let serialisedWrites: Promise<unknown> = Promise.resolve();
const pending = new Map<
  number,
  { timer: ReturnType<typeof setTimeout>; resolve: (ok: boolean) => void; command: Command }
>();
let startedAt = Date.now();
let lastHeartbeat = 0;
let connectionGeneration = 0;
let closingTransport: Promise<void> = Promise.resolve();
let bootNoticeShown = false;
let replayAnchor = 0;
let replayStartIndex = 0;
function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}
export function reportError(e: unknown) {
  useRuntime.setState({ error: errorMessage(e) });
}
function requestOff() {
  useRuntime.setState({ heaterIntent: 0 });
  cancelPendingOn();
  const owner = transport;
  if (owner && useRuntime.getState().transportReady)
    void owner
      .send({ cmd: 'heater', value: 0 })
      .catch((error) =>
        transportFailed(owner, error instanceof Error ? error : new Error(String(error))),
      );
}
function cancelPendingOn() {
  for (const [id, entry] of pending) {
    if (entry.command.cmd !== 'heater' || entry.command.value !== 1) continue;
    clearTimeout(entry.timer);
    pending.delete(id);
    updateCommand(id, 'cancelled');
    entry.resolve(false);
    log('system', `Command ${id} superseded by a heater OFF request.`);
  }
}
export function log(kind: Event['kind'], message: string) {
  const state = useRuntime.getState();
  const event: Event = { sessionId: state.sessionId ?? '', timestamp: Date.now(), kind, message };
  useRuntime.setState({ events: [event, ...state.events].slice(0, 200) });
  if (state.sessionId && state.mode !== 'REPLAY') queueWrite(() => db.events.add(event));
}
function queueWrite(fn: () => Promise<unknown>) {
  serialisedWrites = serialisedWrites.then(fn).catch((e) => {
    useRuntime.setState({
      recordingError: true,
      auto: false,
      error: `Recording failed: ${errorMessage(e)}. Heat requests stopped. Export saved sessions and check browser storage.`,
    });
    requestOff();
  });
}
function updateCommand(id: number, status: Pending['status']) {
  useRuntime.setState((s) => ({
    commands: s.commands.map((c) => (c.id === id ? { ...c, status } : c)),
  }));
}
function ingest(line: string) {
  let data: Telemetry;
  try {
    data = parseTelemetry(line);
  } catch (e) {
    const startup = !useRuntime.getState().receivedAt;
    if (
      startup &&
      !line.trimStart().startsWith('{') &&
      (/^(ets |rst:|boot:|load:|entry |mode:)/i.test(line) ||
        line.includes('\ufffd') ||
        [...line].some((character) => character.charCodeAt(0) <= 8))
    ) {
      if (!bootNoticeShown) {
        log(
          'system',
          'Ignored ESP32 boot output; waiting for a complete validated JSON telemetry packet.',
        );
        bootNoticeShown = true;
      }
      return;
    }
    log('error', `Rejected telemetry: ${errorMessage(e).slice(0, 180)}`);
    return;
  }
  const s = useRuntime.getState();
  if (s.mode === 'DISCONNECTED' || s.mode === 'REPLAY') return;
  const at = Date.now();
  const source: Source = s.mode === 'LIVE' ? 'live' : 'simulated';
  const sample: Sample = { ...data, sessionId: s.sessionId ?? '', timestamp: at, source };
  useRuntime.setState({
    telemetry: data,
    receivedAt: at,
    ...(data.heater !== s.telemetry?.heater ? { lastChange: at } : {}),
  });
  if (data.ack !== undefined && pending.has(data.ack)) {
    const command = pending.get(data.ack)!;
    clearTimeout(command.timer);
    pending.delete(data.ack);
    const accepted = data.accepted === true;
    const confirmed =
      accepted &&
      (command.command.cmd !== 'heater' ||
        (data.heater === command.command.value &&
          (command.command.value === 0 || (!data.fault && data.armed === true)))) &&
      (command.command.cmd !== 'reset_fault' || (data.fault === 0 && data.heater === 0));
    updateCommand(data.ack, confirmed ? 'acknowledged' : accepted ? 'failed' : 'rejected');
    command.resolve(confirmed);
    log(
      'ack',
      `Command ${data.ack} ${confirmed ? 'acknowledged' : accepted ? 'state mismatch' : 'rejected by firmware'}`,
    );
    if (confirmed && s.commands[0]?.id === data.ack && s.error?.startsWith('Command '))
      useRuntime.setState({ error: null });
    if (!confirmed) {
      useRuntime.setState({
        auto: false,
        heaterIntent: 0,
        burstUntil: 0,
        error: accepted
          ? `Command ${data.ack} acknowledged but the reported heater/fault state did not match. Heater OFF requested; inspect the device.`
          : `Command ${data.ack} rejected by firmware. Heater OFF requested; inspect the interlock before retrying.`,
      });
      requestOff();
    }
  }
  if (data.fault !== (s.telemetry?.fault ?? 0)) {
    log('fault', `Fault mask ${data.fault}; heater reported ${data.heater ? 'ON' : 'OFF'}`);
    if (data.fault)
      useRuntime.setState({
        auto: false,
        heaterIntent: 0,
        burstUntil: 0,
        notice: 'Safety interlock active. Inspect the fault before resetting.',
      });
    else
      useRuntime.setState({
        auto: false,
        burstUntil: 0,
        profile: 'IDLE',
        notice: `Firmware fault flags cleared; heater reported ${data.heater ? 'ON — inspect immediately' : 'OFF'}. ${data.armed === false ? 'Relay verification lock remains enabled.' : 'A separate heating request is required.'}`,
      });
  }
  if (data.trip_c !== undefined && Math.abs(data.trip_c - SAFETY.tripC) > 0.01) {
    useRuntime.setState({
      auto: false,
      error: 'Firmware trip threshold differs from the shared configuration. Heating is disabled.',
    });
    requestOff();
  }
  if (s.sessionId)
    queueWrite(async () => {
      await db.samples.add(sample);
      useRuntime.setState((current) =>
        current.sessionId === sample.sessionId
          ? { samples: [...current.samples, sample].slice(-7200) }
          : {},
      );
      if (data.firmware) await db.sessions.update(sample.sessionId, { firmware: data.firmware });
    });
}
export async function issue(command: Command): Promise<boolean> {
  const s = useRuntime.getState();
  if (!transport || !s.transportReady || !['LIVE', 'SIMULATED'].includes(s.mode)) return false;
  const current = transport;
  if (command.cmd === 'heater' && command.value === 1) {
    const blocked = heaterBlockReason();
    if (blocked || s.commands.some((entry) => entry.status === 'pending')) {
      reportError(blocked ?? 'Wait for the current command before requesting heater ON.');
      return false;
    }
  }
  if (command.cmd === 'reset_fault' && !isResettable()) {
    reportError(resetBlockReason() ?? 'Fault reset is not available.');
    return false;
  }
  if (command.cmd === 'heartbeat') {
    await current.send(command);
    return true;
  }
  useRuntime.setState({ heaterIntent: command.cmd === 'heater' ? command.value : 0 });
  if (command.cmd !== 'heater' || command.value === 0) cancelPendingOn();
  const id = counter++;
  const entry: Pending = {
    id,
    label: command.cmd === 'heater' ? `Heater ${command.value ? 'ON' : 'OFF'}` : command.cmd,
    at: Date.now(),
    status: 'pending',
    ...(command.cmd === 'heater' ? { value: command.value } : {}),
  };
  useRuntime.setState((current) => ({ commands: [entry, ...current.commands].slice(0, 100) }));
  log('command', `#${id} ${entry.label}`);
  const result = new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      updateCommand(id, 'timeout');
      log('error', `Command ${id} timed out; heater OFF requested`);
      useRuntime.setState({
        auto: false,
        heaterIntent: 0,
        burstUntil: 0,
        error: `Command ${id} was not acknowledged within 1 s. Heater OFF requested.`,
      });
      requestOff();
      resolve(false);
    }, SAFETY.ackTimeoutMs);
    pending.set(id, { timer, resolve, command });
  });
  try {
    await current.send({ ...command, id });
  } catch (e) {
    const p = pending.get(id);
    if (p) {
      clearTimeout(p.timer);
      pending.delete(id);
      p.resolve(false);
    }
    updateCommand(id, 'failed');
    transportFailed(current, e instanceof Error ? e : new Error(String(e)));
  }
  return result;
}
export function canHeat() {
  return heaterBlockReason() === null;
}
export function heaterBlockReason(): string | null {
  const s = useRuntime.getState(),
    t = s.telemetry,
    ceiling = useSettings.getState().high;
  if (!s.transportReady || !['LIVE', 'SIMULATED'].includes(s.mode))
    return 'Connect an ESP32 or start a labelled simulation to enable heater controls.';
  if (!t || !s.receivedAt || s.now - s.receivedAt > SAFETY.staleMs)
    return 'Wait for fresh validated telemetry before requesting heater ON.';
  if (document.hidden || s.heartbeatPaused) return 'Keep this tab active with heartbeats running.';
  if (t.v !== 2 || t.trip_c == null || Math.abs(t.trip_c - SAFETY.tripC) >= 0.01)
    return 'Compatible v2 firmware with the matching 35.5 °C trip is required.';
  if (!validProbe(t.temp) || (t.temp2 != null && !validProbe(t.temp2)))
    return 'Valid temperature probes are required; inspect the sensor wiring.';
  if (t.fault) return 'Resolve the fault and explicitly reset the safety latch before heating.';
  if (t.armed !== true)
    return 'Relay verification lock is enabled. Complete physical commissioning before changing firmware.';
  if (s.recordingError) return 'Recording failed; resolve browser storage before heating.';
  if (
    t.temp >= Math.min(ceiling, SAFETY.tripC - SAFETY.setpointMarginC) ||
    (t.temp2 != null && t.temp2 >= SAFETY.tripC)
  )
    return `Temperature is at or above the operating ceiling (${ceiling.toFixed(1)} °C). Allow cooldown.`;
  if (s.now - s.lastChange < SAFETY.dwellMs)
    return `Relay dwell: wait ${Math.ceil((SAFETY.dwellMs - s.now + s.lastChange) / 1000)} s before restarting.`;
  return null;
}
async function beginSession(source: Source, generation: number) {
  const id = crypto.randomUUID();
  const settings = useSettings.getState();
  await db.sessions.add({
    id,
    name: `${source === 'live' ? 'Hardware' : 'Simulation'} · ${new Date().toLocaleString()}`,
    startedAt: Date.now(),
    source,
    firmware: 'awaiting telemetry',
    tripC: SAFETY.tripC,
    notes: '',
    ...(source === 'simulated' ? { simSpeed: settings.simSpeed } : {}),
  });
  if (generation !== connectionGeneration) {
    await db.sessions.update(id, { endedAt: Date.now() });
    return false;
  }
  useRuntime.setState({
    sessionId: id,
    samples: [],
    events: [],
    commands: [],
    recordingError: false,
  });
  return true;
}
function transportFailed(owner: Transport, error: Error) {
  if (transport !== owner) return;
  log(
    'error',
    `${error.message}; source disconnected. Reconnect USB before issuing more commands.`,
  );
  reportError(
    `${error.message}. USB connection ended; reconnect the ESP32. Firmware watchdog retains safety authority.`,
  );
  void disconnect();
}
export async function connect(mode: 'LIVE' | 'SIMULATED') {
  if (useRuntime.getState().busy) return;
  const closing = disconnect();
  const generation = connectionGeneration;
  useRuntime.setState({ busy: true, error: null, heartbeatPaused: false });
  bootNoticeShown = false;
  try {
    await closing;
    if (generation !== connectionGeneration) return;
    if (!(await beginSession(mode === 'LIVE' ? 'live' : 'simulated', generation))) return;
    useRuntime.setState({ mode });
    startedAt = Date.now();
    lastHeartbeat = 0;
    if (mode === 'LIVE') {
      const serial = new SerialTransport(
        (line) => {
          if (transport === serial && generation === connectionGeneration) ingest(line);
        },
        (e) => transportFailed(serial, e),
      );
      transport = serial;
      await serial.connect(useSettings.getState().baud);
      if (generation !== connectionGeneration || transport !== serial) {
        await serial.close();
        return;
      }
    } else {
      const sim = new SimulatorTransport(
        (line) => {
          if (transport === sim && generation === connectionGeneration) ingest(line);
        },
        (e) => transportFailed(sim, e),
      );
      transport = sim;
      const c = useSettings.getState();
      sim.worker.postMessage({
        type: 'config',
        config: {
          ambient: c.simAmbient,
          capacity: c.simCapacity,
          loss: c.simLoss,
          efficiency: 0.9,
          speed: c.simSpeed,
        },
      });
    }
    useRuntime.setState({ transportReady: true });
    await transport.send({ cmd: 'heartbeat' });
    if (generation !== connectionGeneration) return;
    lastHeartbeat = Date.now();
    useRuntime.setState({
      notice:
        mode === 'LIVE'
          ? 'USB port connected. Awaiting validated telemetry.'
          : 'SIMULATED mode started. No physical device is controlled.',
    });
    log('system', `${mode} connected; recording started`);
  } catch (e) {
    if (generation === connectionGeneration) {
      reportError(e);
      await disconnect();
    }
  } finally {
    if (generation === connectionGeneration) useRuntime.setState({ busy: false });
  }
}
export async function disconnect() {
  ++connectionGeneration;
  const s = useRuntime.getState();
  const old = transport;
  transport = null;
  useRuntime.setState({
    auto: false,
    heaterIntent: 0,
    busy: false,
    burstUntil: 0,
    replayPlaying: false,
    mode: 'DISCONNECTED',
    transportReady: false,
    telemetry: null,
    receivedAt: 0,
    heartbeatPaused: false,
    sessionId: null,
    samples: [],
    replaySamples: [],
    commands: s.commands.map((c) => (c.status === 'pending' ? { ...c, status: 'failed' } : c)),
  });
  for (const p of pending.values()) {
    clearTimeout(p.timer);
    p.resolve(false);
  }
  pending.clear();
  const before = closingTransport;
  closingTransport = (async () => {
    await before;
    if (old) {
      if (s.transportReady)
        await Promise.race([
          old.send({ cmd: 'heater', value: 0 }).catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, 500)),
        ]);
      await old.close();
    }
  })();
  await closingTransport;
  await serialisedWrites;
  if (s.sessionId && s.mode !== 'REPLAY')
    await db.sessions.update(s.sessionId, { endedAt: Date.now() }).catch(reportError);
}
export function emergencyStop() {
  useRuntime.setState({ auto: false, burstUntil: 0, profile: 'IDLE' });
  return issue({ cmd: 'estop' });
}
export function setProfile(profile: Profile) {
  useRuntime.setState({ profile, auto: profile !== 'IDLE' });
  if (profile === 'IDLE') void issue({ cmd: 'heater', value: 0 });
  log('system', `Workload ${profile}`);
}
export function injectFault(fault: 'thermal' | 'sensor' | 'recover') {
  if (transport instanceof SimulatorTransport) {
    transport.worker.postMessage({ type: 'inject', fault });
    log('system', `SIMULATED fault scenario: ${fault}`);
  }
}
export function pauseHeartbeat() {
  useRuntime.setState({ heartbeatPaused: true, auto: false });
  log('system', 'SIMULATED heartbeat paused for watchdog verification');
}
export function resumeHeartbeat() {
  useRuntime.setState({ heartbeatPaused: false });
  log('system', 'Heartbeat resumed; explicit reset still required');
}
export async function replay(id: string) {
  await disconnect();
  const samples = await db.samples.where('sessionId').equals(id).sortBy('timestamp');
  if (!samples.length) {
    reportError('This session contains no samples.');
    return;
  }
  useRuntime.setState({
    mode: 'REPLAY',
    sessionId: id,
    samples,
    replaySamples: samples,
    replayIndex: 0,
    telemetry: samples[0],
    receivedAt: Date.now(),
    error: null,
    events: await db.events.where('sessionId').equals(id).reverse().toArray(),
  });
}
export function seek(index: number) {
  const s = useRuntime.getState();
  const i = Math.max(0, Math.min(s.replaySamples.length - 1, index));
  useRuntime.setState({
    replayIndex: i,
    telemetry: s.replaySamples[i],
    receivedAt: Date.now(),
    replayPlaying: false,
  });
}
export function playReplay() {
  const s = useRuntime.getState();
  replayAnchor = Date.now();
  replayStartIndex = s.replayIndex;
  useRuntime.setState({ replayPlaying: !s.replayPlaying });
}
export function startRuntime() {
  const timer = setInterval(() => {
    const now = Date.now();
    useRuntime.setState({ now });
    const s = useRuntime.getState();
    if (s.mode === 'REPLAY' && s.replayPlaying) {
      let i = s.replayIndex;
      const target = s.replaySamples[replayStartIndex].timestamp + now - replayAnchor;
      while (i + 1 < s.replaySamples.length && s.replaySamples[i + 1].timestamp <= target) i++;
      useRuntime.setState({
        replayIndex: i,
        telemetry: s.replaySamples[i],
        receivedAt: now,
        replayPlaying: i < s.replaySamples.length - 1,
      });
      return;
    }
    if (!transport || !s.transportReady || !['LIVE', 'SIMULATED'].includes(s.mode)) return;
    if (!document.hidden && !s.heartbeatPaused && now - lastHeartbeat >= SAFETY.heartbeatMs) {
      lastHeartbeat = now;
      const current = transport;
      void current
        .send({ cmd: 'heartbeat' })
        .catch((e) => transportFailed(current, e instanceof Error ? e : new Error(String(e))));
    }
    const stale = now - s.receivedAt > SAFETY.staleMs;
    const settings = useSettings.getState();
    if (
      s.telemetry?.heater &&
      !s.commands.some((c) => c.status === 'pending') &&
      (stale ||
        s.telemetry.temp == null ||
        s.telemetry.temp >= settings.high ||
        (!s.auto && s.heaterIntent === 0))
    ) {
      useRuntime.setState({ auto: false, burstUntil: 0 });
      log('system', 'Operating ceiling, telemetry guard, or OFF intent requested heater OFF.');
      void issue({ cmd: 'heater', value: 0 });
      return;
    }
    if (s.auto && s.telemetry && !s.commands.some((c) => c.status === 'pending')) {
      const request =
        !document.hidden &&
        (s.burstUntil > now || demand(s.profile, s.customDuty, now - startedAt));
      const next = decideHeater({
        temp: s.telemetry.temp,
        fault: s.telemetry.fault,
        stale,
        current: !!s.telemetry.heater,
        lastChange: s.lastChange,
        now,
        request,
        settings: { ...settings, profile: s.profile, customDuty: s.customDuty },
      });
      if (next !== !!s.telemetry.heater) void issue({ cmd: 'heater', value: next ? 1 : 0 });
    }
  }, 250);
  const hide = () => {
    if (document.hidden) {
      useRuntime.setState({ auto: false, heaterIntent: 0, burstUntil: 0 });
      log('system', 'Tab hidden; heartbeat suspended. Firmware watchdog has final authority.');
      requestOff();
    }
  };
  const unload = () => {
    void disconnect();
  };
  document.addEventListener('visibilitychange', hide);
  window.addEventListener('pagehide', unload);
  return () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', hide);
    window.removeEventListener('pagehide', unload);
    void disconnect();
  };
}
export const isResettable = () => {
  return resetBlockReason() === null;
};
export const resetBlockReason = (): string | null => {
  const s = useRuntime.getState(),
    t = s.telemetry;
  if (!s.transportReady || !['LIVE', 'SIMULATED'].includes(s.mode))
    return 'Connect the ESP32 or simulator before resetting.';
  if (!t || !s.receivedAt || s.now - s.receivedAt > SAFETY.staleMs)
    return 'Wait for fresh validated telemetry before resetting.';
  if (!t.fault) return 'There is no latched fault to reset.';
  if (t.v !== 2 || t.trip_c == null || Math.abs(t.trip_c - SAFETY.tripC) > 0.01)
    return 'Compatible v2 firmware and a matching 35.5 °C trip are required for an acknowledged reset.';
  if (!validProbe(t.temp) || (t.temp2 != null && !validProbe(t.temp2)))
    return 'Wait for valid DS18B20 probe readings; inspect the sensor wiring.';
  if (
    t.temp! >= SAFETY.tripC - SAFETY.resetMarginC ||
    (t.temp2 != null && t.temp2 >= SAFETY.tripC - SAFETY.resetMarginC)
  )
    return `Cool all available probes below ${SAFETY.tripC - SAFETY.resetMarginC} °C before resetting.`;
  if (s.heartbeatPaused || document.hidden)
    return 'Keep this tab active and resume heartbeats before resetting.';
  return null;
};
