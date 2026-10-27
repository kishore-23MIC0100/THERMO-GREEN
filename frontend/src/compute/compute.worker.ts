/// <reference lib="webworker" />
import { attentionInference, trainStep } from './model';
let running = false,
  load = 50,
  kind: 'inference' | 'training' = 'inference';
let jobs = 0,
  weight = 0,
  loss: number | null = null,
  checksum = 0,
  totalMs = 0,
  started = 0,
  operations = 0,
  lastReport = 0;
let lossHistory: Array<{ step: number; loss: number }> = [];
function report(complete = false) {
  const now = performance.now(),
    elapsedMs = now - started;
  self.postMessage({
    jobs,
    computeMs: totalMs,
    elapsedMs,
    throughput: elapsedMs > 0 ? jobs / (elapsedMs / 1000) : 0,
    checksum,
    loss,
    operations,
    kind,
    lossHistory,
    complete,
  });
  lastReport = now;
}
self.onmessage = (
  e: MessageEvent<{
    cmd: 'start' | 'stop' | 'load';
    load?: number;
    kind?: 'inference' | 'training';
  }>,
) => {
  const m = e.data;
  if (m.cmd === 'stop') running = false;
  if (m.load !== undefined) load = Math.max(0, Math.min(100, m.load));
  if (m.kind && !running) kind = m.kind;
  if (m.cmd === 'start') {
    running = true;
    jobs = 0;
    weight = 0;
    loss = kind === 'training' ? trainStep(0, 0).loss : null;
    checksum = 0;
    totalMs = 0;
    operations = 0;
    started = performance.now();
    lastReport = started;
    lossHistory = loss === null ? [] : [{ step: 0, loss }];
    report();
  }
};
setInterval(() => {
  if (!running || load === 0) return;
  const start = performance.now();
  if (kind === 'training') {
    // Bounded epochs preserve the learning trajectory for the live demo.
    // Load controls training cadence, not a claim of measured CPU utilization.
    for (let i = 0; i < Math.max(1, Math.ceil(load / 35)); i++) {
      const result = trainStep(weight);
      weight = result.weight;
      loss = result.loss;
      checksum = weight;
      operations += 2048;
      jobs++;
      lossHistory.push({ step: jobs, loss });
      if (loss <= 1e-6 || jobs >= 300) {
        running = false;
        break;
      }
    }
  } else {
    const budget = (25 * load) / 100;
    do {
      const result = attentionInference(jobs + 1);
      checksum = result.checksum;
      operations += result.operations;
      jobs++;
    } while (performance.now() - start < budget);
  }
  totalMs += performance.now() - start;
  if (performance.now() - lastReport >= 250 || !running) report(!running);
}, 50);
