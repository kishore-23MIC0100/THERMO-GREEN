import type { Event, Sample } from '../db/database';
import { faultNames, SAFETY, type Mode } from './config';
import { metrics } from '../analytics/metrics';
import type { Telemetry } from '../hardware/protocol';

const iso = (timestamp: number | null | undefined) =>
  timestamp == null ? null : new Date(timestamp).toISOString();
const round = (value: number, places = 2) => Number(value.toFixed(places));

export function createAnalysisContext(input: {
  mode: Mode;
  sessionId: string | null;
  samples: Sample[];
  events: Event[];
  telemetry: Telemetry | null;
  receivedAt: number;
  now: number;
  simSpeed: number;
  massG: number;
  cp: number;
  targetC: number;
}) {
  const { samples } = input;
  const valid = samples.filter((sample) => sample.temp !== null && !(sample.fault & 2));
  const first = samples[0];
  const last = samples.at(-1);
  const lastValid = valid.at(-1);
  const rateSamples = lastValid
    ? valid.filter((sample) => sample.timestamp >= lastValid.timestamp - 60_000)
    : [];
  const maxPoints = 24;
  const selected =
    rateSamples.length <= maxPoints
      ? rateSamples
      : Array.from({ length: maxPoints }, (_, i) => {
          const index = Math.round((i * (rateSamples.length - 1)) / (maxPoints - 1));
          return rateSamples[index];
        });
  const result = metrics(samples, input.massG, input.cp, input.targetC);
  const telemetry = input.telemetry;
  const telemetryAgeMs = input.receivedAt ? Math.max(0, input.now - input.receivedAt) : null;

  return {
    sourceMode: input.mode,
    sessionId: input.sessionId,
    sourceLabels: [...new Set(samples.map((sample) => sample.source))],
    sampleCount: samples.length,
    recentEvents: input.events.slice(-30).map((event) => ({
      timestamp: iso(event.timestamp),
      kind: event.kind,
      message: event.message.slice(0, 300),
    })),
    timeRange: {
      from: iso(first?.timestamp),
      to: iso(last?.timestamp),
      durationSeconds:
        first && last ? round(Math.max(0, last.timestamp - first.timestamp) / 1000, 1) : null,
    },
    simulationTimeScale: input.mode === 'SIMULATED' ? input.simSpeed : null,
    metrics: result
      ? {
          status: 'calculated from recorded samples',
          temperatureChangeC: round(result.delta),
          sensibleHeatChangeJ: round(result.energyJ, 1),
          recentSlopeCPerMin: result.rate == null ? null : round(result.rate, 3),
          heaterDutyPct: round(result.duty, 1),
          maxRecordedTemperatureC: round(result.max),
          thermalTripCount: result.trips,
          projectedMinutesToSetpoint: result.timeToTarget,
          targetSetpointC: input.targetC,
          assumptions: { waterMassG: input.massG, specificHeatJPerGC: input.cp },
        }
      : {
          status: 'insufficient data',
          requirement: 'at least two valid reactor-temperature samples',
        },
    slopeWindow: {
      method:
        'least-squares linear regression on valid reactor-temperature samples from the latest 60 seconds',
      from: iso(rateSamples[0]?.timestamp),
      to: iso(lastValid?.timestamp),
      sampleCount: rateSamples.length,
      durationSeconds:
        rateSamples.length > 1
          ? round((rateSamples.at(-1)!.timestamp - rateSamples[0].timestamp) / 1000, 1)
          : 0,
    },
    recentTemperatureTrend: selected.map((sample) => ({
      secondsFromWindowStart: round(
        (sample.timestamp - (rateSamples[0]?.timestamp ?? sample.timestamp)) / 1000,
        1,
      ),
      reactorTemperatureC: round(sample.temp!),
      heaterRelayReportedOn: sample.heater === 1,
      faultMask: sample.fault,
      source: sample.source,
    })),
    latestTelemetry: telemetry
      ? {
          observedAt: iso(input.receivedAt || null),
          ageMs: telemetryAgeMs,
          stale:
            input.mode !== 'REPLAY' && telemetryAgeMs != null && telemetryAgeMs > SAFETY.staleMs,
          reactorTemperatureC: telemetry.temp,
          secondProbeTemperatureC: telemetry.temp2 ?? null,
          gasSensorRawRelativeAdc: telemetry.gas,
          heaterRelayReportedOn: telemetry.heater === 1,
          faultMask: telemetry.fault,
          faultNames: faultNames(telemetry.fault),
          firmwareTripC: telemetry.trip_c ?? null,
          firmwareArmed: telemetry.armed ?? null,
          firmwareVersion: telemetry.firmware ?? null,
        }
      : null,
    instrumentationLimits: {
      mq135: 'raw relative ADC only; not calibrated ppm or CO2 concentration',
      electricalPower: 'not instrumented; 40 W heater rating is nominal',
      coolantFlow: 'not instrumented',
      carbonCapture: 'not demonstrated',
      algaeGrowth: 'not demonstrated; biological mode is planned',
    },
  };
}
