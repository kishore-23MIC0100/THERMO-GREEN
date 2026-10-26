import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../components/primitives';
const TwinScene = lazy(() => import('../digital-twin/Scene'));
export default function About() {
  return (
    <>
      <section className="about-hero">
        <div>
          <p className="eyebrow">AlgaeRhythm Bio-Compute</p>
          <h1>Make thermal research visible.</h1>
          <p>Run a workload. Trace the heat. Record the evidence. Explore what comes next.</p>
          <Link className="button primary" to="/">
            Open Control Center <ArrowRight size={18} />
          </Link>
        </div>
        <Suspense>
          <TwinScene hero />
        </Suspense>
      </section>
      <section className="panel panel-body">
        <h2>From computing demand to a recorded experiment</h2>
        <ol className="process-flow horizontal">
          <li>
            <strong>Run compute</strong>
            <p>
              Numerical inference or local LLM generation creates a transparent workload request.
            </p>
          </li>
          <li>
            <strong>Represent heat</strong>
            <p>A nominal 40 W PTC plate stands in for server heat.</p>
          </li>
          <li>
            <strong>Transfer through water</strong>
            <p>A closed loop moves heat into an isolated reactor exchanger.</p>
          </li>
          <li>
            <strong>Measure and protect</strong>
            <p>DS18B20 readings drive recording while ESP32 interlocks guard the heater.</p>
          </li>
        </ol>
      </section>
      <section className="panel table-wrap">
        <h2 className="panel-body">Capability & evidence matrix</h2>
        <table>
          <thead>
            <tr>
              <th>Capability</th>
              <th>Classification</th>
              <th>Evidence boundary</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                'Temperature and relative gas ADC',
                'MEASURED',
                'Only when reported by connected sensors. Physical hardware acceptance tests remain required.',
              ],
              [
                'Software demonstration',
                'SIMULATED',
                'Working thermal-model mode and separately measured local compute jobs.',
              ],
              [
                'Thermal energy and heating rate',
                'CALCULATED',
                'Derived from recorded samples and explicit mass / specific heat assumptions.',
              ],
              [
                'Nominal heater / pump ratings',
                'ESTIMATED',
                '40 W and ~1.2 L/min are specified ratings, not instrumented power or flow.',
              ],
              [
                'Spirulina cultivation',
                'PROJECTED',
                'Planned module. No growth or carbon fixation demonstrated.',
              ],
              [
                'CO₂ mass captured / data-centre savings',
                'NOT CLAIMED',
                'No calibrated measurements or carbon mass balance are available.',
              ],
            ].map(([feature, claim, detail]) => (
              <tr key={feature}>
                <td>{feature}</td>
                <td>
                  <Badge claim={claim} />
                </td>
                <td>{detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
