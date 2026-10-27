import { PanelHeading, Empty } from '../components/primitives';
import { TrendingDown } from 'lucide-react';
import { useCompute } from './store';
export function TrainingLoss() {
  const stats = useCompute((s) => s.stats);
  const running = useCompute((s) => s.running);
  const points = stats?.kind === 'training' ? stats.lossHistory : [];
  const maxStep = Math.max(200, points.at(-1)?.step ?? 0);
  const path = points
    .map(
      (p) =>
        `${52 + (p.step / maxStep) * 680},${32 + (1 - (Math.log10(Math.max(1e-7, p.loss)) + 7) / 8) * 190}`,
    )
    .join(' ');
  return (
    <section className="panel training-loss-panel">
      <PanelHeading
        icon={TrendingDown}
        title="Training loss"
        subtitle="Actual mean squared error · synthetic y = 2x · logarithmic scale"
      />
      {points.length ? (
        <div className="panel-body">
          <div className="loss-summary">
            <strong>{stats?.loss?.toExponential(3)} MSE</strong>
            <span>
              {stats?.jobs} epochs · coefficient {stats?.checksum.toFixed(6)} / target 2.000000
            </span>
            <span>
              {stats?.complete
                ? 'Converged · training complete'
                : running
                  ? 'Training in progress'
                  : 'Training stopped'}
            </span>
          </div>
          <svg
            viewBox="0 0 760 260"
            role="img"
            aria-label={`Training MSE decreased from ${points[0].loss.toFixed(4)} to ${stats?.loss?.toExponential(3)} across ${stats?.jobs} epochs.`}
          >
            {[1, 0, -2, -4, -6].map((value) => {
              const y = 32 + (1 - (value + 7) / 8) * 190;
              return (
                <g key={value}>
                  <line x1="52" y1={y} x2="732" y2={y} stroke="#dce8ed" />
                  <text x="42" y={y + 4} textAnchor="end" fill="#50677f" fontSize="11">
                    10^{value}
                  </text>
                </g>
              );
            })}
            <line x1="52" y1="222" x2="732" y2="222" stroke="#b0c6d0" />
            <polyline
              points={path}
              fill="none"
              stroke="#00a878"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {[0, 50, 100, 150, 200].map((step) => (
              <text
                key={step}
                x={52 + (step / maxStep) * 680}
                y="244"
                textAnchor="middle"
                fill="#50677f"
                fontSize="11"
              >
                {step}
              </text>
            ))}
            <text x="735" y="255" textAnchor="end" fill="#50677f" fontSize="11">
              Epoch
            </text>
          </svg>
          <p>
            Each point is calculated from an actual gradient update. Load sets the epoch cadence.
            The run stops when MSE ≤ 10⁻⁶ or after 300 epochs; no heater is enabled by training
            alone.
          </p>
        </div>
      ) : (
        <Empty title="No training run yet">
          <p>
            Choose Gradient descent training in Job type, then Run compute to see the measured
            learning curve.
          </p>
        </Empty>
      )}
    </section>
  );
}
