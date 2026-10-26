import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { useLiveQuery } from 'dexie-react-hooks';
import { FlaskConical, Leaf, ClipboardCheck } from 'lucide-react';
import { db } from '../db/database';
import { reportError } from '../stores/runtime';
import { PanelHeading, Badge } from '../components/primitives';
import { ReactorModes } from '../components/DashboardPanels';
import { SAFETY } from '../lib/config';
import { PageTitle } from './Operations';
export function Modes() {
  return (
    <>
      <PageTitle
        title="Reactor Modes"
        description="The current apparatus demonstrates heat transfer. Chemical and biological outcomes require separate controlled experiments."
      />
      <ReactorModes />
      <div className="notice-panel">
        Changing a research workspace does not issue heater commands. Existing experiments keep
        their telemetry source and safety state.
      </div>
    </>
  );
}
export function Chemistry() {
  const [name, setName] = useState(''),
    [condition, setCondition] = useState<'ambient' | 'heated'>('ambient'),
    [mass, setMass] = useState(''),
    [blank, setBlank] = useState('0'),
    [method, setMethod] = useState('');
  const results =
    useLiveQuery(() => db.chemistry.orderBy('timestamp').reverse().toArray(), []) ?? [];
  return (
    <>
      <PageTitle
        title="Chemical Research"
        description="Planned / experimental: calcium hydroxide mineralization with an ambient-temperature control."
      />
      <div className="warning-panel">
        <strong>Material compatibility is mandatory.</strong> Bare aluminium + lime water (pH &gt;
        12) can corrode and release hydrogen. Use distilled water for the current demo, or a
        chemically compatible isolated exchanger.
      </div>
      <div className="two-columns">
        <section className="panel">
          <PanelHeading icon={FlaskConical} title="Controlled experiment protocol" />
          <div className="panel-body">
            <div className="equation">Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O</div>
            <Badge claim="NOT CLAIMED" />
            <p>
              The reaction proceeds at room temperature. Heat is not a trigger. Warming changes
              kinetics and reduces CO₂ and Ca(OH)₂ solubility; compare with an ambient control.
            </p>
            <ol className="prose-list">
              <li>
                Prepare matched reagent concentration and volume. Record initial temperature, gas
                exposure, and vessel geometry.
              </li>
              <li>
                Run an ambient control and a heated condition with the same exposure and mixing.
              </li>
              <li>
                Record temperature histories, observations, reagent blanks, and sampling times.
              </li>
              <li>
                Filter, dry to constant mass, weigh precipitate, and document balance calibration
                and chemical identification.
              </li>
              <li>Compare records. Precipitate mass alone is not proof of net carbon removal.</li>
            </ol>
            <p>
              Design estimates: air near 420 ppm CO₂; 1 L/min supplies about 0.8 mg CO₂/min. A 250
              mL saturated lime-water batch absorbs at most roughly 0.25 g CO₂. These are
              supply/chemistry estimates, not current measurements.
            </p>
            <Badge claim="ESTIMATED" />
          </div>
        </section>
        <section className="panel">
          <PanelHeading
            icon={ClipboardCheck}
            title="Manual measurement notebook"
            subtitle="Records user-entered evidence; no automatic capture result"
          />
          <form
            className="panel-body"
            onSubmit={(e) => {
              e.preventDefault();
              void db.chemistry
                .add({
                  name: name.trim(),
                  condition,
                  precipitateG: Number(mass),
                  blankG: Number(blank),
                  method: method.trim(),
                  timestamp: Date.now(),
                })
                .then(() => {
                  setName('');
                  setMass('');
                  setMethod('');
                })
                .catch(reportError);
            }}
          >
            <label>
              Experiment name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
              />
            </label>
            <label>
              Condition
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as typeof condition)}
              >
                <option value="ambient">Ambient control</option>
                <option value="heated">Heated condition</option>
              </select>
            </label>
            <label>
              Dry precipitate mass (g)
              <input
                required
                type="number"
                min="0"
                max="1000"
                step="0.0001"
                value={mass}
                onChange={(e) => setMass(e.target.value)}
              />
            </label>
            <label>
              Blank mass (g)
              <input
                required
                type="number"
                min="0"
                max="1000"
                step="0.0001"
                value={blank}
                onChange={(e) => setBlank(e.target.value)}
              />
            </label>
            <label>
              Concentration, exposure, calibration & method
              <textarea
                required
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                maxLength={4000}
              />
            </label>
            <button className="primary" type="submit">
              Save entered measurement
            </button>
          </form>
        </section>
      </div>
      <section className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Experiment</th>
              <th>Condition</th>
              <th>Precipitate</th>
              <th>Blank</th>
              <th>Provenance</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.name}
                  <small className="block">{r.method}</small>
                </td>
                <td>{r.condition}</td>
                <td>{r.precipitateG} g</td>
                <td>{r.blankG} g</td>
                <td>
                  <Badge claim="MEASURED" /> USER-ENTERED
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!results.length && (
          <p className="panel-body">No measurements entered. Carbon captured: not claimed.</p>
        )}
      </section>
    </>
  );
}
function PlannedVessel() {
  return (
    <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [2.6, 2.5, 3.5], fov: 40 }}>
      <ambientLight intensity={2} />
      <directionalLight position={[3, 4, 2]} intensity={3} />
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1.3, 40, 1, true]} />
        <meshPhysicalMaterial
          color="#d9f5eb"
          transmission={0.6}
          transparent
          opacity={0.4}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.46, 0.46, 0.95, 40]} />
        <meshStandardMaterial color="#397f4d" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 1.31, 0]}>
        <cylinderGeometry args={[0.53, 0.53, 0.08, 40]} />
        <meshStandardMaterial color="#566d78" metalness={0.8} />
      </mesh>
      <mesh position={[-0.9, 0.65, 0]}>
        <boxGeometry args={[0.07, 1.3, 0.8]} />
        <meshStandardMaterial color="#d9f5eb" emissive="#338064" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.25, 0.7, 0]}>
        <torusGeometry args={[0.2, 0.025, 8, 32, Math.PI * 1.7]} />
        <meshStandardMaterial color="#bcc7cf" metalness={0.8} />
      </mesh>
      {[
        [-0.2, 'CO₂ inlet'],
        [0, 'Gas outlet'],
        [0.2, 'pH / temperature ports'],
      ].map(([x, label]) => (
        <group key={String(label)} position={[Number(x), 1.38, 0]}>
          <mesh>
            <cylinderGeometry args={[0.025, 0.025, 0.2, 10]} />
            <meshStandardMaterial color="#c2d8dc" />
          </mesh>
          <Html position={[0, 0.25 + Number(x), 0]} center>
            <span className="part-label">{label}</span>
          </Html>
        </group>
      ))}
      <Html position={[-0.95, 1.5, 0]} center>
        <span className="part-label">LED panel</span>
      </Html>
      <Html position={[0.7, 0.5, 0]} center>
        <span className="part-label">Sampling port / isolated coil</span>
      </Html>
      <OrbitControls enableDamping minDistance={2} maxDistance={6} />
    </Canvas>
  );
}
export function Algae() {
  const items = [
    'OD680 / dry-weight biomass',
    'pH and culture chemistry',
    'Temperature history',
    'Light intensity and photoperiod',
    'Inlet and outlet CO₂',
    'Carbon mass balance',
  ];
  const [checked, setChecked] = useState<string[]>([]);
  return (
    <>
      <PageTitle
        title="Spirulina Photobioreactor"
        description="A separate proposed research module with dedicated biological measurements."
      />
      <div className="planned-banner">
        PLANNED — NOT DEMONSTRATED · Warm water alone does not capture carbon.
      </div>
      <div className="two-columns">
        <section className="panel planned-scene">
          <PanelHeading
            icon={Leaf}
            title="Proposed culture vessel"
            subtitle="Static concept visualization; no growth data"
          />
          <div style={{ height: 400 }}>
            <PlannedVessel />
          </div>
          <Badge claim="PROJECTED" />
        </section>
        <section className="panel">
          <PanelHeading icon={ClipboardCheck} title="Required measurements" />
          <div className="panel-body">
            <p>
              Check items as planning notes only. These checks do not certify evidence or
              demonstrate growth.
            </p>
            {items.map((item) => (
              <label className="check" key={item}>
                <input
                  type="checkbox"
                  checked={checked.includes(item)}
                  onChange={(e) =>
                    setChecked((current) =>
                      e.target.checked ? [...current, item] : current.filter((i) => i !== item),
                    )
                  }
                />
                {item}
              </label>
            ))}
            <h3>Approximate thermal window</h3>
            <div className="temperature-window">
              <span>Below 30 °C</span>
              <span>
                30–35 °C
                <br />
                Approx. optimum
              </span>
              <span>
                38–40 °C
                <br />
                Damage risk
              </span>
            </div>
            <p>
              System trip marker: {SAFETY.tripC} °C. Species, light, pH, and growth conditions
              affect these approximate ranges.
            </p>
            <Badge claim="ESTIMATED" />
            <p>
              Dedicated culture vessel, LED panel, air diffuser, CO₂ inlet, gas outlet, sampling
              port, pH provision and isolated heat exchanger require separate commissioning.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
