import type { Sample } from '../db/database';
export function metrics(samples: Sample[], massG = 330, cp = 4.184, target = 35) {
  const valid = samples.filter((s) => s.temp !== null && !(s.fault & 2));
  if (valid.length < 2) return null;
  const first = valid[0],
    last = valid[valid.length - 1];
  const elapsed = (last.timestamp - first.timestamp) / 1000;
  const recent = valid.filter((s) => s.timestamp >= last.timestamp - 60000);
  const times = recent.map((s) => (s.timestamp - recent[0].timestamp) / 60000);
  const meanX = times.reduce((a, b) => a + b, 0) / times.length,
    meanY = recent.reduce((a, b) => a + b.temp!, 0) / recent.length;
  const den = times.reduce((a, x) => a + (x - meanX) ** 2, 0);
  const rate = den
    ? recent.reduce((a, s, i) => a + (times[i] - meanX) * (s.temp! - meanY), 0) / den
    : null;
  let onMs = 0,
    totalMs = 0,
    trips = 0,
    lastFault = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    if (s.fault & 1 && !(lastFault & 1)) trips++;
    lastFault = s.fault;
    if (i > 0) {
      const dt = s.timestamp - samples[i - 1].timestamp;
      if (dt <= 2000 && dt > 0) {
        totalMs += dt;
        onMs += dt * samples[i - 1].heater;
      }
    }
  }
  const delta = last.temp! - first.temp!;
  return {
    delta,
    energyJ: massG * cp * delta,
    rate,
    duty: totalMs ? (onMs / totalMs) * 100 : 0,
    max: Math.max(...valid.map((s) => s.temp!)),
    trips,
    elapsed,
    timeToTarget: rate && rate > 0 ? Math.max(0, (target - last.temp!) / rate) : null,
  };
}
// Largest-Triangle-Three-Buckets preserves spikes better than stride sampling.
export function lttb<T>(
  data: T[],
  threshold: number,
  x: (p: T) => number,
  y: (p: T) => number,
): T[] {
  if (data.length <= threshold || threshold < 3) return data;
  const selected = [data[0]],
    every = (data.length - 2) / (threshold - 2);
  let a = 0;
  for (let i = 0; i < threshold - 2; i++) {
    const avgStart = Math.floor((i + 1) * every) + 1,
      avgEnd = Math.min(Math.floor((i + 2) * every) + 1, data.length);
    let avgX = 0,
      avgY = 0;
    for (let j = avgStart; j < avgEnd; j++) {
      avgX += x(data[j]);
      avgY += y(data[j]);
    }
    const count = avgEnd - avgStart;
    avgX /= count || 1;
    avgY /= count || 1;
    const start = Math.floor(i * every) + 1,
      end = Math.min(Math.floor((i + 1) * every) + 1, data.length - 1);
    let max = -1,
      next = start;
    for (let j = start; j < end; j++) {
      const area = Math.abs(
        (x(data[a]) - avgX) * (y(data[j]) - y(data[a])) -
          (x(data[a]) - x(data[j])) * (avgY - y(data[a])),
      );
      if (area > max) {
        max = area;
        next = j;
      }
    }
    selected.push(data[next]);
    a = next;
  }
  selected.push(data[data.length - 1]);
  return selected;
}
export function csvCell(v: unknown): string {
  let s = String(v ?? '');
  if (/^[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
