import { Usb, Cable, TriangleAlert } from 'lucide-react';
import { PanelHeading } from '../components/primitives';
import { ConnectionBar } from '../components/DashboardPanels';
import { PageTitle } from './Operations';
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
      <div className="two-columns">
        <section className="panel">
          <PanelHeading icon={Cable} title="GPIO & power mapping" />
          <div className="table-wrap">
            <table>
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
        <div className="flow-diagrams">
          <div>
            <h3>Fluid loop · isolated from reactor medium</h3>
            <p>Pump → Block #1 on heater → Block #2 inside reactor → Pump</p>
          </div>
          <div>
            <h3>Control & telemetry</h3>
            <p>Browser ⇄ USB serial ⇄ ESP32 → GPIO 23 → relay → PTC heater</p>
          </div>
          <div>
            <h3>Independent supply branches</h3>
            <p>12 V / 5 A supply → fused heater branch + direct pump branch. USB → ESP32 logic.</p>
          </div>
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
