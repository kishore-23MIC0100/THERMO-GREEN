import { Usb, Cable, TriangleAlert, ArrowRight } from 'lucide-react';
import { PanelHeading } from '../components/primitives';
import { ConnectionBar } from '../components/DashboardPanels';
import { PageTitle } from './Operations';
function SystemPath({ title, steps, detail }: { title: string; steps: string[]; detail: string }) {
  return (
    <div className="system-path-card">
      <h3>{title}</h3>
      <ol className="path-steps">
        {steps.map((step, index) => (
          <li key={`${step}-${index}`}>
            <span>{step}</span>
            {index < steps.length - 1 && <ArrowRight size={14} aria-hidden="true" />}
          </li>
        ))}
      </ol>
      <p>{detail}</p>
    </div>
  );
}
export default function Hardware() {
  const mapping = [
    ['DS18B20 DATA', 'GPIO 4 + 4.7 kΩ pull-up to 3.3 V'],
    ['DS18B20 VDD / GND', '3.3 V / GND'],
    ['MQ-135 AO', 'GPIO 34 through verified 5 V → 3.3 V divider'],
    ['Relay IN', 'GPIO 23; verify active-LOW vs active-HIGH'],
    ['ESP32 logic', 'USB to the computer'],
    ['40 W PTC heater', 'Fused 12 V branch through DC-rated relay'],
    ['R385 pump', 'Separate direct 12 V branch; not switchable by ESP32'],
  ];
  return (
    <>
      <PageTitle
        title="Hardware Setup"
        description="Commission the electrical and liquid systems before enabling physical heater output."
      />
      <ConnectionBar />
      {!('serial' in navigator) && (
        <div className="warning-panel">
          Web Serial is unavailable here. Use Chrome or Edge on desktop over localhost or HTTPS, or
          choose simulation.
        </div>
      )}
      <div className="two-columns hardware-page-grid">
        <section className="panel">
          <PanelHeading
            icon={Cable}
            title="GPIO & power mapping"
            subtitle="Firmware defaults · verify against the physical wiring"
          />
          <div
            className="table-wrap hardware-table"
            tabIndex={0}
            role="region"
            aria-label="GPIO mapping scroll area"
          >
            <table aria-label="GPIO and power mapping">
              <thead>
                <tr>
                  <th>Hardware</th>
                  <th>Connection</th>
                </tr>
              </thead>
              <tbody>
                {mapping.map(([part, pin]) => (
                  <tr key={part}>
                    <td>{part}</td>
                    <td>{pin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <PanelHeading icon={Usb} title="Bring-up procedure" />
          <ol className="process-flow">
            <li>
              <strong>Build and flash</strong>
              <p>
                Install PlatformIO; run <code>pio run -d firmware/esp32 -t upload</code>. Firmware
                defaults to relay output locked until polarity is verified.
              </p>
            </li>
            <li>
              <strong>Verify relay with heater disconnected</strong>
              <p>
                Use a suitably rated test lamp. Set RELAY_ACTIVE_LOW correctly, verify OFF through
                boot/reset, then set RELAY_POLARITY_VERIFIED true and reflash.
              </p>
            </li>
            <li>
              <strong>Inspect sensor telemetry</strong>
              <p>
                Close Arduino Serial Monitor. Connect ESP32 here and check fresh readings, fault
                state, firmware trip, and optional second probe.
              </p>
            </li>
            <li>
              <strong>Confirm autonomous protection</strong>
              <p>
                Test sensor disconnect, E-stop, cutoff, and lost heartbeat with the test load. Reset
                requires a safe temperature and a restored link.
              </p>
            </li>
            <li>
              <strong>Commission the wet loop</strong>
              <p>
                Leak-test with distilled water. Confirm circulation physically. Keep the electronics
                dry and above the loop.
              </p>
            </li>
          </ol>
        </section>
      </div>
      <section className="panel">
        <PanelHeading icon={Cable} title="System paths" />
        <div className="system-paths-grid">
          <SystemPath
            title="Closed coolant loop"
            steps={['Pump', 'Block #1', 'Block #2', 'Pump']}
            detail="Block #1 collects heater heat. The exchanger transfers it through an isolated stainless loop into reactor water; the fluids do not mix."
          />
          <SystemPath
            title="Heater command path"
            steps={['Dashboard', 'USB', 'ESP32', 'Relay', 'Heater']}
            detail="GPIO 23 requests the relay state. Firmware interlocks take precedence; the dashboard does not measure contact movement or electrical power."
          />
          <SystemPath
            title="Sensor feedback"
            steps={['DS18B20 / MQ-135', 'ESP32', 'USB', 'Charts + twin']}
            detail="115200 baud JSON telemetry supplies temperature, raw gas ADC and firmware-reported heater state."
          />
          <SystemPath
            title="Separate power branches"
            steps={['12 V supply', 'Fused heater + direct pump']}
            detail="USB powers ESP32 logic. The pump runs from its own direct 12 V branch and has no software switch or measured flow."
          />
        </div>
      </section>
      <section className="panel">
        <PanelHeading icon={TriangleAlert} title="Troubleshooting & limits" />
        <div className="panel-body">
          <details>
            <summary>Permission denied or port busy</summary>
            <p>
              Reconnect the USB cable, close Arduino/PlatformIO monitors, then click Connect ESP32
              again. The browser must receive a user gesture to open the serial chooser.
            </p>
          </details>
          <details>
            <summary>No serial port appears</summary>
            <p>
              Use a data-capable USB cable. Check the board's CP210x or CH340 USB chip and install
              the corresponding driver from its manufacturer if required.
            </p>
          </details>
          <details>
            <summary>Telemetry is stale or malformed</summary>
            <p>
              Match 115200 baud, verify newline-delimited JSON, and inspect wiring. Invalid lines
              are rejected and logged. Stale data disables heating.
            </p>
          </details>
          <details>
            <summary>Critical physical limitations</summary>
            <p>
              No measured flow, no software pump switch, no measured heater power. A reactor sensor
              alone cannot protect a locally overheating cold plate after pump failure; add a second
              DS18B20 on Block #1. Prevent fluids contacting rails. Never use bare aluminium in lime
              water. Relay contacts must be DC rated and the heater branch fused.
            </p>
          </details>
        </div>
      </section>
    </>
  );
}
