// A real, deliberately small single-head attention forward pass. Deterministic
// synthetic weights; not a pretrained LLM and not a scientific forecasting model.
export function attentionInference(
  seed = 1,
  tokens = 32,
  width = 32,
): { checksum: number; operations: number } {
  const x = new Float64Array(tokens * width),
    q = new Float64Array(tokens * width),
    k = new Float64Array(tokens * width),
    v = new Float64Array(tokens * width);
  for (let i = 0; i < x.length; i++) x[i] = Math.sin((i + seed) * 0.17);
  for (let t = 0; t < tokens; t++)
    for (let d = 0; d < width; d++)
      for (let j = 0; j < width; j++) {
        const value = x[t * width + j] / width;
        q[t * width + d] += value * Math.sin(j * width + d + 1);
        k[t * width + d] += value * Math.cos(j * width + d + 2);
        v[t * width + d] += value * Math.sin(j * width + d + 3);
      }
  let checksum = 0;
  const scores = new Float64Array(tokens);
  for (let t = 0; t < tokens; t++) {
    let sum = 0;
    for (let u = 0; u < tokens; u++) {
      let dot = 0;
      for (let d = 0; d < width; d++) dot += q[t * width + d] * k[u * width + d];
      scores[u] = Math.exp(dot / Math.sqrt(width));
      sum += scores[u];
    }
    for (let d = 0; d < width; d++) {
      let out = 0;
      for (let u = 0; u < tokens; u++) out += (scores[u] / sum) * v[u * width + d];
      checksum += out;
    }
  }
  return { checksum, operations: 6 * tokens * width * width + 4 * tokens * tokens * width };
}
export function trainStep(weight: number, learningRate = 0.05) {
  let loss = 0,
    gradient = 0;
  for (let i = 1; i <= 128; i++) {
    const x = i / 128,
      target = 2 * x;
    const error = weight * x - target;
    loss += error * error;
    gradient += 2 * error * x;
  }
  const nextWeight = weight - (learningRate * gradient) / 128;
  // Report loss at the returned weight, so the coefficient and loss describe
  // the same training state. The initial zero-rate call records epoch zero.
  let nextLoss = 0;
  for (let i = 1; i <= 128; i++) nextLoss += (((nextWeight - 2) * i) / 128) ** 2;
  return { weight: nextWeight, loss: nextLoss / 128, previousLoss: loss / 128 };
}
