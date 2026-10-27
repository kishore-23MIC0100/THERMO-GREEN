import { useEffect, useRef, useState } from 'react';
import { Bot, Send, WifiOff } from 'lucide-react';
import { useSettings } from '../stores/settings';
import { useRuntime, canHeat, log } from '../stores/runtime';
import { metrics } from '../analytics/metrics';
import { streamAnswer, validateOllamaUrl } from '../lib/ollama';
import { Badge, PanelHeading } from '../components/primitives';
import { PageTitle } from './Operations';
export default function Assistant() {
  const settings = useSettings(),
    runtime = useRuntime();
  const [prompt, setPrompt] = useState(''),
    [answer, setAnswer] = useState(''),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState<'unchecked' | 'online' | 'offline'>('unchecked'),
    [error, setError] = useState(''),
    [duration, setDuration] = useState(0);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function check() {
    setError('');
    try {
      const r = await fetch(`${validateOllamaUrl(settings.ollamaUrl)}/api/tags`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!r.ok) throw new Error(`Status ${r.status}`);
      const result = (await r.json()) as { models?: Array<{ name: string }> };
      setStatus('online');
      if (!result.models?.some((m) => m.name === settings.model))
        setError(
          `Ollama is reachable, but ${settings.model} is not installed. Pull the model or change Settings.`,
        );
    } catch (e) {
      setStatus('offline');
      setError(e instanceof Error ? e.message : 'Ollama is unreachable');
    }
  }
  async function submit(question: string) {
    if (!question.trim() || busy) return;
    setPrompt(question);
    setBusy(true);
    setAnswer('');
    setError('');
    const c = new AbortController();
    controller.current = c;
    const timer = setTimeout(() => c.abort(), 120000);
    const start = performance.now();
    const samples = runtime.samples;
    const stats = metrics(samples, settings.massG, settings.cp);
    const context = {
      source: runtime.mode,
      from: samples[0] ? new Date(samples[0].timestamp).toISOString() : null,
      to: samples.at(-1) ? new Date(samples.at(-1)!.timestamp).toISOString() : null,
      stats,
      lastTelemetry: runtime.telemetry,
      sampleCount: samples.length,
    };
    try {
      await streamAnswer(
        settings.ollamaUrl,
        settings.model,
        `You are AlgaeRhythm's local, tools-free experiment-analysis advisor. You cannot inspect hardware or issue commands; use only the session context below. Cite its source and exact time range when available. Label claims MEASURED, CALCULATED, ESTIMATED, SIMULATED, PROJECTED, UNAVAILABLE, or NOT CLAIMED, and say "insufficient data" when evidence is absent. Never invent a fault cause or readings. The MQ-135 is raw relative ADC, not calibrated ppm. Electrical power and coolant flow are not instrumented; the 40 W heater figure is nominal. The thermal vehicle is not a real server/data center. Carbon capture and algae growth are not demonstrated. Never advise bypassing firmware safety: its 35.5 °C trip and interlocks have final authority; stale telemetry, faults, or uncertainty mean keep the heater OFF. For heating rate, calculate from timestamped reactor samples and disclose sample coverage; 1.7 °C/min is only an ideal estimate for nominal 40 W and about 1,380 J/°C before losses. Candidate causes (ambient loss, hardware thermal mass, coupling, mixing/flow, sensor lag) are hypotheses unless the data distinguishes them. Session context JSON: ${JSON.stringify(context)}`,
        question,
        setAnswer,
        c.signal,
      );
      setStatus('online');
      setDuration(performance.now() - start);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
      if (!c.signal.aborted) setStatus('offline');
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }
  const burstMs = Math.min(20000, Math.max(5000, Math.ceil(answer.length / 100) * 1000));
  return (
    <>
      <PageTitle
        title="AI Research Assistant"
        description="Optional local Ollama. Advisory analysis only; the model has no hardware-control tools."
      />
      <div className="toolbar">
        <Badge
          claim={
            status === 'online'
              ? 'LOCAL MODEL REACHABLE'
              : status === 'offline'
                ? 'OFFLINE'
                : 'NOT CHECKED'
          }
        />
        <button onClick={() => void check()}>Check Ollama</button>
        <span>{settings.model}</span>
      </div>
      <div className="two-columns">
        <section className="panel">
          <PanelHeading
            icon={Bot}
            title="Ask about your experiment"
            subtitle="Uses the current recorded session and its time range"
          />
          <div className="panel-body">
            <div className="prompt-chips">
              {[
                'Summarise this session',
                'Explain this fault',
                'Why is heating slower than 1.7 °C/min?',
              ].map((q) => (
                <button key={q} disabled={busy} onClick={() => void submit(q)}>
                  {q}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit(prompt);
              }}
            >
              <label>
                Question
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={8000}
                  required
                  placeholder="Ask a research question or generate an explanation…"
                />
              </label>
              <div className="button-row">
                <button className="primary" disabled={busy || !prompt.trim()} type="submit">
                  <Send size={16} />
                  {busy ? 'Generating…' : 'Generate locally'}
                </button>
                {busy && (
                  <button type="button" onClick={() => controller.current?.abort()}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
            {error && (
              <p role="alert" className="warning-text">
                {error}
              </p>
            )}
            <div className="assistant-answer" aria-live="polite">
              {answer ? (
                <>
                  <Badge claim="AI ANALYSIS · VERIFY" />
                  <p>{answer}</p>
                </>
              ) : (
                <p>No generated response yet. Responses are never mocked.</p>
              )}
            </div>
            {answer && !busy && (
              <div className="llm-burst">
                <h3>LLM-triggered workload simulation</h3>
                <p>
                  {answer.length} characters generated in {(duration / 1000).toFixed(1)} s. Mapping:
                  ceil(characters / 100) × 1 s, clamped to 5–20 s = {burstMs / 1000} s requested
                  burst.
                </p>
                <button
                  disabled={!canHeat()}
                  onClick={() => {
                    useRuntime.setState({
                      auto: true,
                      profile: 'IDLE',
                      burstUntil: Date.now() + burstMs,
                    });
                    log(
                      'system',
                      `User requested LLM-derived workload burst ${burstMs} ms from ${answer.length} characters`,
                    );
                  }}
                >
                  Request {burstMs / 1000} s workload burst
                </button>
                <p>
                  Explicit operator request; the controller and firmware retain safety authority.
                </p>
              </div>
            )}
          </div>
        </section>
        <section className="panel">
          <PanelHeading icon={WifiOff} title="Local model setup" />
          <div className="panel-body">
            <ol className="prose-list">
              <li>Install Ollama from its official site.</li>
              <li>
                From the project folder, run <code>ollama pull qwen2.5:3b</code> and then{' '}
                <code>npm run model:build</code> to create the AlgaeRhythm analysis profile.
              </li>
              <li>
                Allow the dashboard origin before starting Ollama:{' '}
                <code>
                  OLLAMA_ORIGINS=https://thermo-green.vercel.app,http://localhost:5173,http://127.0.0.1:5173
                  ollama serve
                </code>
                .
              </li>
              <li>Keep the service bound to loopback, then select Check Ollama.</li>
            </ol>
            <p>
              For the macOS desktop app, set{' '}
              <code>
                launchctl setenv OLLAMA_ORIGINS
                "https://thermo-green.vercel.app,http://localhost:5173,http://127.0.0.1:5173"
              </code>{' '}
              and restart Ollama.
            </p>
            <p>
              In Settings, select <code>thermo-green-analyst:latest</code>. Session data stays local
              and is sent only to your configured Ollama instance. This profile applies
              project-specific instructions and examples to Qwen; it does not update the model's
              weights. See the project analysis-model guide for details.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
