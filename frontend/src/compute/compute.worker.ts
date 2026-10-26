/// <reference lib="webworker" />
import { attentionInference, trainStep } from './model';
let running = false,
  load = 50,
  kind: 'inference' | 'training' = 'inference',
  jobs = 0,
  weight = 0,
  loss: number | null = null,
  checksum = 0,
  totalMs = 0,
  started = 0,
  operations = 0,
  lastReport = 0;
self.onmessage = (
  e: MessageEvent<{
    cmd: 'start' | 'stop' | 'load';
    load?: number;
    kind?: 'inference' | 'training';
  }>,
) => {
  const m = e.data;
  if (m.cmd === 'stop') running = false;
  if (m.load !== undefined) load = Math.max(1, Math.min(100, m.load));
  if (m.kind) kind = m.kind;
  if (m.cmd === 'start') {
    running = true;
    jobs = 0;
    weight = 0;
    loss = null;
    checksum = 0;
    totalMs = 0;
    operations = 0;
    started = performance.now();
    lastReport = started;
  }
};
setInterval(() => {
  if (!running) return;
  const start = performance.now();
  const budget = (25 * load) / 100;
  do {
    if (kind === 'inference') {
      const result = attentionInference(jobs + 1);
      checksum = result.checksum;
      operations += result.operations;
    } else {
      const result = trainStep(weight);
      weight = result.weight;
      loss = result.loss;
      checksum = weight;
      operations += 1024;
    }
    jobs++;
  } while (performance.now() - start < budget);
  totalMs += performance.now() - start;
  const now = performance.now();
  if (now - lastReport >= 500) {
    self.postMessage({
      jobs,
      computeMs: totalMs,
      elapsedMs: now - started,
      throughput: jobs / ((now - started) / 1000),
      checksum,
      loss,
      operations,
      kind,
    });
    lastReport = now;
  }
}, 50);
