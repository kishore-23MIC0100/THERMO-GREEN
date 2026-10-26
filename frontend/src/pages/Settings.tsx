import { useState } from 'react';
import { SlidersHorizontal, Usb, Database, ShieldCheck } from 'lucide-react';
import { useSettings } from '../stores/settings';
import { useRuntime, reportError } from '../stores/runtime';
import { validateOllamaUrl } from '../lib/ollama';
import { PanelHeading, Badge } from '../components/primitives';
import { ConnectionBar } from '../components/DashboardPanels';
import { PageTitle } from './Operations';
import { SAFETY } from '../lib/config';
export default function Settings() {
  const s = useSettings(),
    mode = useRuntime((s) => s.mode);
  const [url, setUrl] = useState(s.ollamaUrl),
    [message, setMessage] = useState('');
  const disconnected = mode === 'DISCONNECTED';
  return (
    <>
      <PageTitle
        title="Settings"
        description="Safety thresholds are shared with firmware. Model and presentation preferences stay in this browser."
      />
      <div className="two-columns">
        <section className="panel">
          <PanelHeading icon={Usb} title="Device & control" />
          <div className="panel-body">
            <ConnectionBar />
            <label>
              Serial baud rate
              <select
                value={s.baud}
                disabled={!disconnected}
                onChange={(e) => s.update({ baud: Number(e.target.value) })}
              >
                <option value={115200}>115200 (firmware default)</option>
                <option value={9600}>9600 (legacy firmware only)</option>
              </select>
            </label>
            <label>
              Lower setpoint (°C)
              <input
                type="number"
                min="15"
                max={s.high - 0.5}
                step="0.5"
                value={s.low}
                onChange={(e) => s.update({ low: Number(e.target.value) })}
              />
            </label>
            <label>
              Upper setpoint (°C)
              <input
                type="number"
                min="15.5"
                max={SAFETY.tripC - SAFETY.setpointMarginC}
                step="0.5"
                value={s.high}
                onChange={(e) => s.update({ high: Number(e.target.value) })}
              />
            </label>
            <p>
              Hard trip: {SAFETY.tripC} °C. Cooldown reset below{' '}
              {SAFETY.tripC - SAFETY.resetMarginC} °C. Update shared/safety.json and rebuild both
              targets to change safety configuration.
            </p>
            <Badge claim="CONFIGURATION" />
          </div>
        </section>
        <section className="panel">
          <PanelHeading icon={SlidersHorizontal} title="Presentation" />
          <div className="panel-body">
            <label>
              Display units
              <select
                value={s.units}
                onChange={(e) => s.update({ units: e.target.value as 'C' | 'F' })}
              >
                <option value="C">Celsius</option>
                <option value="F">Fahrenheit</option>
              </select>
            </label>
            <p>Recorded data, charts, and controller configuration always use °C.</p>
            <label>
              3D quality
              <select
                value={s.quality}
                onChange={(e) => s.update({ quality: e.target.value as typeof s.quality })}
              >
                <option value="low">Low · no transmission or effects</option>
                <option value="medium">Medium · glass transmission</option>
                <option value="high">High · shadows and subtle bloom</option>
              </select>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={s.reducedMotion}
                onChange={(e) => s.update({ reducedMotion: e.target.checked })}
              />
              Reduce motion
            </label>
            <button onClick={() => s.update({ tourDone: false })}>Show guided tour again</button>
          </div>
        </section>
        <section className="panel">
          <PanelHeading
            icon={ShieldCheck}
            title="Thermal simulator"
            subtitle="Applied when a new simulation starts"
          />
          <div className="panel-body">
            <label>
              Ambient temperature (°C)
              <input
                disabled={!disconnected}
                type="number"
                min="15"
                max="32"
                value={s.simAmbient}
                onChange={(e) =>
                  s.update({ simAmbient: Math.max(15, Math.min(32, Number(e.target.value))) })
                }
              />
            </label>
            <label>
              Total heat capacity (J/°C)
              <input
                disabled={!disconnected}
                type="number"
                min="1380"
                max="5000"
                value={s.simCapacity}
                onChange={(e) =>
                  s.update({ simCapacity: Math.max(1380, Math.min(5000, Number(e.target.value))) })
                }
              />
            </label>
            <label>
              Heat loss coefficient (W/°C)
              <input
                disabled={!disconnected}
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={s.simLoss}
                onChange={(e) =>
                  s.update({ simLoss: Math.max(0, Math.min(10, Number(e.target.value))) })
                }
              />
            </label>
            <label>
              Simulation time scale
              <select
                disabled={!disconnected}
                value={s.simSpeed}
                onChange={(e) => s.update({ simSpeed: Number(e.target.value) })}
              >
                <option value={1}>1× real time</option>
                <option value={10}>10× accelerated demo</option>
                <option value={30}>30× accelerated demo</option>
              </select>
            </label>
            <p>
              Watchdog and command deadlines always use real wall time. CSV metadata records the
              simulation speed.
            </p>
          </div>
        </section>
        <section className="panel">
          <PanelHeading icon={Database} title="Local AI & storage" />
          <div className="panel-body">
            <label>
              Ollama URL
              <input value={url} onChange={(e) => setUrl(e.target.value)} />
            </label>
            <button
              onClick={() => {
                try {
                  s.update({ ollamaUrl: validateOllamaUrl(url) });
                  setMessage('Local endpoint saved');
                } catch (e) {
                  reportError(e);
                }
              }}
            >
              Save local endpoint
            </button>
            <label>
              Model name
              <input
                value={s.model}
                maxLength={120}
                onChange={(e) => s.update({ model: e.target.value })}
              />
            </label>
            <button
              onClick={() =>
                void navigator.storage
                  ?.persist()
                  .then((ok) =>
                    setMessage(
                      ok
                        ? 'Persistent browser storage granted'
                        : 'Browser did not grant persistent storage; export regularly.',
                    ),
                  )
                  .catch(reportError)
              }
            >
              Request persistent storage
            </button>
            <p aria-live="polite">{message}</p>
            <p>
              Records are retained until you clear this site's browser storage. No automatic
              deletion. Export sessions before resetting browser data.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
