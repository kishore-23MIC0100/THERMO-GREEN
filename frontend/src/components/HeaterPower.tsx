import { Square } from 'lucide-react';
import { useId } from 'react';
import { useRuntime, issue, canHeat, heaterBlockReason } from '../stores/runtime';
import { useCompute } from '../compute/store';
import { SAFETY } from '../lib/config';

export function HeaterPower() {
  const s = useRuntime();
  const feedbackId = useId();
  const connected = s.transportReady && ['LIVE', 'SIMULATED'].includes(s.mode);
  const fresh = connected && !!s.telemetry && s.now - s.receivedAt <= SAFETY.staleMs;
  const on = fresh && s.telemetry?.heater === 1;
  const pending = s.commands.find(
    (command) => command.status === 'pending' && command.value != null,
  );
  const busy = s.commands.some((command) => command.status === 'pending');
  const request = (value: 0 | 1) => {
    // A manual action takes ownership from every automatic workload source.
    useCompute.setState({ linked: false });
    useRuntime.setState({ auto: false, profile: 'IDLE', burstUntil: 0 });
    void issue({ cmd: 'heater', value });
  };
  const state = !fresh ? 'Unavailable' : on ? 'ON' : 'OFF';
  return (
    <div className="heater-power-controls">
      <div className="button-row">
        <button
          type="button"
          role="switch"
          aria-label="Heater power"
          aria-checked={on}
          aria-describedby={feedbackId}
          className={`heater-switch ${on ? 'is-on' : ''}`}
          disabled={on ? !connected : !canHeat() || busy}
          onClick={() => request(on ? 0 : 1)}
        >
          <span className="switch-track" aria-hidden="true">
            <i />
          </span>
          <span>
            Heater power<strong>{state}</strong>
          </span>
        </button>
        <button className="stop-heater" disabled={!connected} onClick={() => request(0)}>
          <Square size={18} /> Stop Heater
        </button>
      </div>
      <p id={feedbackId} className="heater-feedback" aria-live="polite">
        {pending
          ? `Requesting ${pending.value ? 'ON' : 'OFF'} — awaiting firmware confirmation. Reported state: ${state}.`
          : !fresh || !on
            ? (heaterBlockReason() ?? 'Ready. Toggle ON to send a heater request.')
            : 'Firmware reports ON. Toggle OFF or select Stop Heater to stop.'}
      </p>
      <small>
        Switch position follows fresh firmware telemetry; relay contacts and power are not
        independently measured.
      </small>
    </div>
  );
}
