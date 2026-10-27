import { useId } from 'react';
import { Link } from 'react-router-dom';
import { useRuntime, issue, canHeat, heaterBlockReason } from '../stores/runtime';
import { useCompute } from '../compute/store';
import { SAFETY } from '../lib/config';

export function HeaterPower() {
  const s = useRuntime();
  const feedbackId = useId();
  const connected = s.transportReady && ['LIVE', 'SIMULATED'].includes(s.mode);
  const fresh = connected && !!s.telemetry && s.now - s.receivedAt <= SAFETY.staleMs;
  const on = fresh && s.telemetry?.heater === 1;
  const locked = fresh && s.telemetry?.armed === false;
  const pending = s.commands.find(
    (command) => command.status === 'pending' && command.value != null,
  );
  const busy = s.commands.some((command) => command.status === 'pending');
  const canRequestOff = on || pending?.value === 1;
  const request = (value: 0 | 1) => {
    // A manual action takes ownership from every automatic workload source.
    useCompute.setState({ linked: false });
    useRuntime.setState({ auto: false, profile: 'IDLE', burstUntil: 0 });
    void issue({ cmd: 'heater', value });
  };
  const state = !fresh ? 'Unavailable' : on ? 'ON' : locked ? 'OFF · Relay locked' : 'OFF';
  return (
    <div className="heater-power-controls">
      <button
        type="button"
        role="switch"
        aria-label="Heater power"
        aria-checked={on}
        aria-busy={!!pending}
        aria-describedby={feedbackId}
        className={`heater-switch ${on ? 'is-on' : ''}`}
        disabled={canRequestOff ? !connected : !canHeat() || busy}
        onClick={() => request(canRequestOff ? 0 : 1)}
      >
        <span className="switch-track" aria-hidden="true">
          <i />
        </span>
        <span>
          Heater power<strong>{state}</strong>
        </span>
      </button>
      <p id={feedbackId} className="heater-feedback" aria-live="polite">
        {pending
          ? `Requesting ${pending.value ? 'ON' : 'OFF'} — awaiting firmware confirmation. Reported state: ${state}.${pending.value === 1 ? ' Select the toggle again to cancel.' : ''}`
          : !fresh || !on
            ? (heaterBlockReason() ?? 'Ready. Toggle ON to send a heater request.')
            : 'Firmware reports ON. Toggle OFF to stop heating.'}
      </p>
      {locked && (
        <Link className="text-link" to="/hardware">
          Relay verification steps
        </Link>
      )}
      <small>
        Switch position follows fresh firmware telemetry; relay contacts and power are not
        independently measured.
      </small>
    </div>
  );
}
