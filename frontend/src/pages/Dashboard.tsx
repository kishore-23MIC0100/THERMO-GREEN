import { Suspense } from 'react';
import {
  SystemStatus,
  WorkloadPanel,
  TrendPanel,
  ReactorModes,
  QuickControls,
  RecentEvents,
} from '../components/DashboardPanels';
import { useRuntime, seek, playReplay } from '../stores/runtime';
import { TwinScene } from '../digital-twin/LazyTwin';
export default function Dashboard() {
  const s = useRuntime();
  return (
    <>
      <div className="dashboard-top">
        <Suspense fallback={<div className="panel scene-skeleton">Preparing digital twin…</div>}>
          <TwinScene />
        </Suspense>
        <SystemStatus />
      </div>
      {s.mode === 'REPLAY' && (
        <section className="replay-bar">
          <strong>REPLAY</strong>
          <button onClick={playReplay}>{s.replayPlaying ? 'Pause' : 'Play'}</button>
          <input
            aria-label="Replay position"
            type="range"
            min={0}
            max={Math.max(0, s.replaySamples.length - 1)}
            value={s.replayIndex}
            onChange={(e) => seek(Number(e.target.value))}
          />
          <span>
            {s.replayIndex + 1} / {s.replaySamples.length} samples
          </span>
        </section>
      )}
      <div className="dashboard-middle">
        <WorkloadPanel />
        <TrendPanel />
        <TrendPanel gas />
      </div>
      <div className="dashboard-bottom">
        <ReactorModes />
        <QuickControls />
        <RecentEvents />
      </div>
    </>
  );
}
