import { create } from 'zustand';
import { log, useRuntime, issue } from '../stores/runtime';
export interface ComputeStats {
  jobs: number;
  computeMs: number;
  elapsedMs: number;
  throughput: number;
  checksum: number;
  loss: number | null;
  operations: number;
  kind: 'inference' | 'training';
  lossHistory: Array<{ step: number; loss: number }>;
  complete: boolean;
}
interface ComputeState {
  running: boolean;
  load: number;
  kind: 'inference' | 'training';
  linked: boolean;
  stats: ComputeStats | null;
  history: number[];
  error: string | null;
}
export const useCompute = create<ComputeState>(() => ({
  running: false,
  load: 50,
  kind: 'inference',
  linked: false,
  stats: null,
  history: [],
  error: null,
}));
let worker: Worker | null = null;
export function configureCompute(patch: Partial<Pick<ComputeState, 'load' | 'kind' | 'linked'>>) {
  useCompute.setState({ ...patch, ...(patch.kind ? { stats: null, history: [] } : {}) });
  const s = useCompute.getState();
  worker?.postMessage({ cmd: 'load', load: s.load, kind: s.kind });
  if (patch.linked === false) {
    useRuntime.setState({ auto: false, burstUntil: 0 });
    void issue({ cmd: 'heater', value: 0 });
  }
}
export function runCompute() {
  if (!worker) {
    worker = new Worker(new URL('./compute.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<ComputeStats>) => {
      useCompute.setState((s) => ({
        stats: e.data,
        ...(e.data.complete ? { running: false } : {}),
        history: [...s.history, e.data.throughput].slice(-18),
      }));
      if (e.data.complete) {
        stopCompute();
        log(
          'system',
          `Training converged after ${e.data.jobs} epochs; MSE ${e.data.loss?.toExponential(3)}.`,
        );
        return;
      }
      const s = useCompute.getState();
      const r = useRuntime.getState();
      if (s.linked && s.running) {
        if (
          r.mode === 'DISCONNECTED' ||
          r.mode === 'REPLAY' ||
          r.telemetry?.fault ||
          r.error ||
          document.hidden
        ) {
          useCompute.setState({ linked: false });
          useRuntime.setState({ auto: false, burstUntil: 0 });
        } else {
          useRuntime.setState({ auto: true, profile: 'CUSTOM', customDuty: s.load / 100 });
        }
      }
    };
    worker.onerror = (e) => {
      useCompute.setState({ error: e.message, running: false });
      stopCompute();
    };
  }
  const s = useCompute.getState();
  worker.postMessage({ cmd: 'start', load: s.load, kind: s.kind });
  useCompute.setState({ running: true, stats: null, history: [], error: null });
  log(
    'system',
    `Local ${s.kind} compute demonstration started. Heater coupling ${s.linked ? 'enabled' : 'disabled'}.`,
  );
}
export function stopCompute() {
  worker?.postMessage({ cmd: 'stop' });
  const s = useCompute.getState();
  useCompute.setState({ running: false });
  if (s.linked) {
    useRuntime.setState({ auto: false, burstUntil: 0, profile: 'IDLE' });
    void issue({ cmd: 'heater', value: 0 });
  }
  if (s.running) log('system', 'Local compute demonstration stopped.');
}
export function disposeCompute() {
  stopCompute();
  worker?.terminate();
  worker = null;
}
