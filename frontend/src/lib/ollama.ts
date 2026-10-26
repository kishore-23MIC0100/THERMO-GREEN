export function validateOllamaUrl(raw: string) {
  const url = new URL(raw);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.username ||
    url.password
  )
    throw new Error('Use a local Ollama URL (localhost, 127.0.0.1, or [::1]) without credentials.');
  return url.origin;
}
export async function streamAnswer(
  url: string,
  model: string,
  system: string,
  prompt: string,
  onText: (text: string) => void,
  signal: AbortSignal,
) {
  const response = await fetch(`${validateOllamaUrl(url)}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      options: { temperature: 0.2 },
    }),
    signal,
  });
  if (!response.ok)
    throw new Error(
      `Ollama returned ${response.status}. Check that the configured model is installed.`,
    );
  if (!response.body) throw new Error('Ollama returned an empty response');
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let pending = '',
    answer = '';
  const parse = (line: string) => {
    if (!line.trim()) return;
    const data = JSON.parse(line) as { message?: { content?: string }; error?: string };
    if (data.error) throw new Error(data.error);
    answer += data.message?.content ?? '';
    onText(answer);
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      const lines = pending.split('\n');
      pending = lines.pop() ?? '';
      for (const line of lines) parse(line);
      if (pending.length > 1_000_000) throw new Error('Ollama response line too large');
    }
    parse(pending);
    return answer;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
