import { it, expect } from 'vitest';
import { attentionInference, trainStep } from './model';
it('runs a deterministic, finite attention pass that depends on its inputs', () => {
  const a = attentionInference(1, 8, 8),
    b = attentionInference(2, 8, 8);
  expect(Number.isFinite(a.checksum)).toBe(true);
  expect(a).toEqual(attentionInference(1, 8, 8));
  expect(a.checksum).not.toBe(b.checksum);
  expect(a.operations).toBeGreaterThan(0);
});
it('learns the known synthetic regression target', () => {
  let weight = 0,
    loss = 10;
  for (let i = 0; i < 300; i++) {
    const result = trainStep(weight);
    expect(result.loss).toBeLessThanOrEqual(loss);
    weight = result.weight;
    loss = result.loss;
  }
  expect(weight).toBeCloseTo(2, 3);
  expect(loss).toBeLessThan(1e-6);
});
