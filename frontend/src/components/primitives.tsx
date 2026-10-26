import {
  Component,
  useEffect,
  useRef,
  type ErrorInfo,
  type ReactNode,
  type ComponentType,
} from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Claim } from '../lib/config';
import { useRuntime } from '../stores/runtime';
import { useSettings } from '../stores/settings';
export function Badge({ claim }: { claim: Claim | string }) {
  return <span className={`badge badge-${claim.toLowerCase().replaceAll(' ', '-')}`}>{claim}</span>;
}
export function PanelHeading({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel-heading">
      <span className="icon-tile">
        <Icon size={23} />
      </span>
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="panel-action">{action}</div>}
    </div>
  );
}
export function Metric({
  label,
  value,
  unit,
  claim,
  detail,
  age,
}: {
  label: string;
  value: string | number | null;
  unit?: string;
  claim: Claim;
  detail: string;
  age?: string;
}) {
  return (
    <div className="metric" title={detail}>
      <div className="metric-label">
        {label}
        <Badge claim={value === null ? 'UNAVAILABLE' : claim} />
      </div>
      <strong>
        {value ?? 'Unavailable'}
        {value !== null && unit && <small> {unit}</small>}
      </strong>
      <p>{detail}</p>
      {age && <small>As of {age}</small>}
    </div>
  );
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function tempDisplay(c: number | null | undefined, units: 'C' | 'F') {
  return c == null
    ? 'Unavailable'
    : `${(units === 'F' ? (c * 9) / 5 + 32 : c).toFixed(1)} °${units}`;
}
export function useReading() {
  const s = useRuntime();
  const units = useSettings((s) => s.units);
  const stale = s.mode !== 'REPLAY' && s.now - s.receivedAt > 2000;
  return {
    ...s,
    units,
    stale,
    available: s.telemetry !== null && s.mode !== 'DISCONNECTED',
    claim: (s.mode === 'SIMULATED' ||
    (s.telemetry && 'source' in s.telemetry && s.telemetry.source === 'simulated')
      ? 'SIMULATED'
      : s.mode === 'DISCONNECTED'
        ? 'UNAVAILABLE'
        : 'MEASURED') as Claim,
    age:
      s.mode === 'REPLAY'
        ? 'recorded sample'
        : s.receivedAt
          ? `${Math.max(0, (s.now - s.receivedAt) / 1000).toFixed(1)} s ago`
          : 'no sample',
  };
}
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application boundary', error, info.componentStack);
  }
  render() {
    if (this.state.error)
      return (
        <div className="empty">
          <AlertTriangle />
          <h2>This view could not load</h2>
          <p>{this.state.error}</p>
          <button onClick={() => location.reload()}>Reload application</button>
        </div>
      );
    return this.props.children;
  }
}
export function Confirm({
  title,
  children,
  onConfirm,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog ref={ref} onCancel={onClose} className="confirm-dialog">
      <button aria-label="Close dialog" className="close" onClick={onClose}>
        <X size={18} />
      </button>
      <h2>{title}</h2>
      <div>{children}</div>
      <div className="button-row">
        <button onClick={onClose}>Cancel</button>
        <button className="primary" onClick={onConfirm}>
          Confirm reset
        </button>
      </div>
    </dialog>
  );
}
