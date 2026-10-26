import { useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { lttb } from '../analytics/metrics';
import type { Sample } from '../db/database';
import { Empty } from './primitives';
import { SAFETY } from '../lib/config';
export default function TelemetryChart({
  samples,
  kind = 'temperature',
  compact = false,
  paused = false,
  compare,
}: {
  samples: Sample[];
  kind?: 'temperature' | 'gas' | 'heater';
  compact?: boolean;
  paused?: boolean;
  compare?: { samples: Sample[]; name: string };
}) {
  const frozen = useRef(samples);
  if (!paused) frozen.current = samples;
  const data = frozen.current;
  const option = useMemo(() => {
    const picked = lttb(
      data,
      compact ? 100 : 800,
      (s) => s.timestamp,
      (s) => s.temp ?? 0,
    );
    const key = kind === 'temperature' ? 'temp' : kind === 'gas' ? 'gas' : 'heater';
    function points(rows: Sample[], k: 'temp' | 'temp2' | 'gas' | 'heater', aligned = false) {
      const result: Array<[number, number | null]> = [];
      rows.forEach((s, i) => {
        const time = aligned ? s.timestamp - rows[0].timestamp : s.timestamp;
        if (i && s.timestamp - rows[i - 1].timestamp > SAFETY.staleMs)
          result.push([time - 1, null]);
        result.push([time, s[k] ?? null]);
      });
      return result;
    }
    const source = data[0]?.source === 'simulated' ? ' · SIMULATED' : '';
    const series: Array<Record<string, unknown>> = [
      {
        name:
          (kind === 'temperature' ? 'Reactor' : kind === 'gas' ? 'Raw ADC' : 'Reported relay') +
          source,
        type: 'line',
        data: points(picked, key, !!compare),
        showSymbol: false,
        smooth: false,
        connectNulls: false,
        step: kind === 'heater' ? 'end' : undefined,
        lineStyle: { width: 2, color: kind === 'gas' ? '#a66bff' : '#00e5a0' },
        itemStyle: { color: kind === 'gas' ? '#a66bff' : '#00e5a0' },
        areaStyle: { opacity: 0.06 },
        markLine:
          kind === 'temperature'
            ? {
                silent: true,
                symbol: 'none',
                label: { show: !compact, formatter: 'Safety trip' },
                lineStyle: { color: '#ff5c63', type: 'dashed' },
                data: [{ yAxis: SAFETY.tripC }],
              }
            : undefined,
      },
    ];
    if (kind === 'temperature' && data.some((s) => s.temp2 != null))
      series.push({
        name: 'Second probe' + source,
        type: 'line',
        data: points(picked, 'temp2', !!compare),
        showSymbol: false,
        connectNulls: false,
        lineStyle: { color: '#ff8a3d', width: 2 },
      });
    if (compare)
      series.push({
        name: compare.name + (compare.samples[0]?.source === 'simulated' ? ' · SIMULATED' : ''),
        type: 'line',
        showSymbol: false,
        connectNulls: false,
        data: points(
          lttb(
            compare.samples,
            800,
            (s) => s.timestamp,
            (s) => s.temp ?? 0,
          ),
          key,
          true,
        ),
        lineStyle: { color: '#22d3ee', width: 2, type: 'dashed' },
      });
    return {
      animation: false,
      backgroundColor: 'transparent',
      textStyle: { fontFamily: 'Inter', color: '#9ab0c3' },
      aria: { enabled: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#102338',
        borderColor: '#29485b',
        textStyle: { color: '#f4f8fb' },
      },
      grid: {
        left: compact ? 42 : 55,
        right: compact ? 12 : 24,
        top: compact ? 12 : 40,
        bottom: compact ? 28 : 65,
      },
      legend: { show: !compact, textStyle: { color: '#9ab0c3' }, top: 4 },
      xAxis: {
        type: compare ? 'value' : 'time',
        name: compare ? 'Elapsed milliseconds' : undefined,
        axisLabel: { color: '#9ab0c3', fontSize: 10 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        scale: kind !== 'heater',
        name: kind === 'temperature' ? '°C' : kind === 'gas' ? 'ADC' : '0 / 1',
        min: kind === 'heater' ? 0 : undefined,
        max: kind === 'heater' ? 1 : undefined,
        axisLabel: { color: '#9ab0c3', fontSize: 10 },
        splitLine: { lineStyle: { color: '#193242' } },
      },
      dataZoom: compact
        ? []
        : [
            { type: 'inside' },
            {
              type: 'slider',
              height: 18,
              bottom: 10,
              borderColor: '#19384b',
              textStyle: { color: '#9ab0c3' },
            },
          ],
      series,
    };
  }, [data, kind, compact, compare]);
  if (!data.length)
    return (
      <Empty title="Awaiting telemetry">
        <p>Connect an ESP32 or start a labelled simulation to record a trace.</p>
      </Empty>
    );
  return (
    <ReactECharts
      option={option}
      notMerge
      style={{ height: compact ? 132 : 360, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
export function Sparkline({ values, color = '#00e5a0' }: { values: number[]; color?: string }) {
  if (values.length < 2)
    return <div className="spark-empty" role="img" aria-label="No trend samples" />;
  const min = Math.min(...values),
    span = Math.max(1, Math.max(...values) - min);
  const points = values
    .slice(-25)
    .map((v, i, a) => `${(i / (a.length - 1)) * 96},${30 - ((v - min) / span) * 26}`)
    .join(' ');
  return (
    <svg className="sparkline" viewBox="0 0 100 36" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}
