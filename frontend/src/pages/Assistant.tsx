import { useEffect, useRef, useState } from 'react';
import { Bot, Send, WifiOff } from 'lucide-react';
import { useSettings } from '../stores/settings';
import { useRuntime, canHeat, log } from '../stores/runtime';
import { createAnalysisContext } from '../lib/analysis-context';
import { ANALYSIS_MODEL } from '../lib/analysis-model';
import { streamAnswer, validateOllamaUrl } from '../lib/ollama';
import { Badge, PanelHeading } from '../components/primitives';
import { PageTitle } from './Operations';
export default function Assistant() {
  const settings = useSettings(),
    runtime = useRuntime();
  const [prompt, setPrompt] = useState(''),
    [answer, setAnswer] = useState(''),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState<'unchecked' | 'ready' | 'model-missing' | 'offline'>(
      'unchecked',
    ),
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
      if (!result.models?.some((m) => m.name === settings.model.trim())) {
        setStatus('model-missing');
        setError(
          `Ollama is running, but ${settings.model.trim() || 'no model'} is not installed. Build ${ANALYSIS_MODEL} with npm run model:build or change Settings.`,
        );
        return;
      }
      setStatus('ready');
    } catch (e) {
      setStatus('offline');
      setError(
        e instanceof TypeError
          ? 'The browser could not reach local Ollama. Check that its service is running, allow local-network access for this dashboard, and include this dashboard origin in OLLAMA_ORIGINS.'
          : e instanceof Error
            ? e.message
            : 'Ollama is unreachable',
      );
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
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      c.abort();
    }, 120000);
    const start = performance.now();
    const samples = runtime.samples;
    const context = createAnalysisContext({
      mode: runtime.mode,
      sessionId: runtime.sessionId,
      samples,
      events: runtime.events,
      telemetry: runtime.telemetry,
      receivedAt: runtime.receivedAt,
      now: runtime.now,
      simSpeed: settings.simSpeed,
      massG: settings.massG,
      cp: settings.cp,
      targetC: settings.high,
    });
    try {
      await streamAnswer(
        settings.ollamaUrl,
        settings.model,
        context,
        question,
        setAnswer,
        c.signal,
      );
      setStatus('ready');
      setDuration(performance.now() - start);
    } catch (e) {
      setError(
        c.signal.aborted
          ? timedOut
            ? 'Analysis timed out after 2 minutes. Check that Ollama is responsive, then retry.'
            : 'Analysis cancelled.'
          : e instanceof TypeError
            ? 'The browser could not reach local Ollama. Check local-network access and the OLLAMA_ORIGINS allowlist.'
            : e instanceof Error
              ? e.message
              : 'Generation failed',
      );
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
            status === 'ready'
              ? 'LOCAL MODEL REACHABLE'
              : status === 'model-missing'
                ? 'MODEL NOT INSTALLED'
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
