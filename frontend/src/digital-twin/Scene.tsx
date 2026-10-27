import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Html,
  OrbitControls,
  ContactShadows,
  Environment,
  Lightformer,
  Line,
} from '@react-three/drei';
import { BackSide, CatmullRomCurve3, Color, Group, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Maximize, RotateCcw, Layers, Box as BoxIcon, X, Eye, Focus } from 'lucide-react';
import { PARTS, type PartId } from './parts';
import { LAYOUT, type Vec } from './layout';
import { EquipmentAsset } from './models/EquipmentAsset';
import { useRuntime } from '../stores/runtime';
import { useSettings } from '../stores/settings';
import { SAFETY, faultNames } from '../lib/config';
import { connectionStatus } from '../lib/connection-status';

const LABELS: Partial<Record<PartId, [string, string]>> = {
  heater: ['AI Compute', '40 W PTC heater'],
  coldplate: ['Aluminium Block #1', 'Heat source'],
  exchanger: ['Aluminium Block #2', 'Heat exchanger'],
  pump: ['R385 Water Pump', '12 V direct · flow unmeasured'],
  reactor: ['Reactor Container', '250 mL · water prototype'],
  probe: ['DS18B20', 'Temperature sensor'],
  gas: ['MQ-135', 'Relative gas sensor'],
  esp32: ['ESP32 DevKit V1', 'USB controller'],
};
function Part({
  id,
  explode,
  select,
  selected,
  labels,
  hiddenParts,
  children,
}: {
  id: keyof typeof LAYOUT;
  explode: boolean;
  select: (id: PartId) => void;
  selected: PartId | null;
  labels: boolean;
  hiddenParts: PartId[];
  children: ReactNode;
}) {
  const ref = useRef<Group>(null);
  const [hover, setHover] = useState(false);
  const { invalidate } = useThree();
  const layout = LAYOUT[id];
  const target = useMemo(
    () => new Vector3(...layout.at).add(new Vector3(...(explode ? layout.explode : [0, 0, 0]))),
    [layout, explode],
  );
  useEffect(() => {
    invalidate();
  }, [target, invalidate]);
  useFrame((_, dt) => {
    if (ref.current && ref.current.position.distanceTo(target) > 0.001) {
      ref.current.position.lerp(target, Math.min(dt * 9, 1));
      invalidate();
    }
  });
  const label = LABELS[id];
  if (hiddenParts.includes(id)) return null;
  return (
    <group
      ref={ref}
      position={layout.at}
      visible={!hiddenParts.includes(id)}
      onClick={(e) => {
        e.stopPropagation();
        select(id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
    >
      {children}
      {(hover || selected === id) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
          <ringGeometry args={[0.48, 0.5, 64]} />
          <meshBasicMaterial color="#00a878" transparent opacity={0.8} />
        </mesh>
      )}
      {label && labels && !hiddenParts.includes(id) && (
        <>
          <Line
            points={[[0, id === 'pump' ? 0.35 : 0.95, 0], layout.label]}
            color="#058c70"
            lineWidth={0.7}
            dashed
            dashSize={0.045}
            gapSize={0.035}
          />
          <Html
            position={layout.label}
            center
            zIndexRange={[2, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <div className={`part-label ${selected === id ? 'selected' : ''}`}>
              <strong>{label[0]}</strong>
              <small>{label[1]}</small>
            </div>
          </Html>
        </>
      )}
    </group>
  );
}
function Tube({
  points,
  warm = false,
  flow = false,
  wire = false,
  color,
  radius = 0.062,
}: {
  points: Vec[];
  warm?: boolean;
  flow?: boolean;
  wire?: boolean;
  color?: string;
  radius?: number;
}) {
  const curve = useMemo(
    () =>
      new CatmullRomCurve3(
        points.map((p) => new Vector3(...p)),
        false,
        'catmullrom',
        0.35,
      ),
    [points],
  );
  const dots = useRef<Group>(null);
  const phase = useRef(0);
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [flow, invalidate]);
  useFrame((_, dt) => {
    if (!flow || !dots.current) return;
    phase.current = (phase.current + dt * 0.12) % 1;
    dots.current.children.forEach((child, i) =>
      child.position.copy(curve.getPointAt((phase.current + i / 3) % 1)),
    );
    invalidate();
  });
  const tint = color ?? (warm ? '#ff762a' : '#0cbdeb');
  return (
    <group>
      <mesh castShadow={!wire}>
        <tubeGeometry args={[curve, 80, radius, 12, false]} />
        <meshPhysicalMaterial
          color={tint}
          roughness={wire ? 0.48 : 0.18}
          metalness={wire ? 0.05 : 0.1}
          clearcoat={wire ? 0 : 1}
          transparent={!wire}
          opacity={wire ? 1 : 0.5}
          depthWrite={wire}
        />
      </mesh>
      {!wire && (
        <mesh>
          <tubeGeometry args={[curve, 80, radius * 0.64, 10, false]} />
          <meshBasicMaterial color={tint} toneMapped={false} />
        </mesh>
      )}
      {flow && (
        <group ref={dots}>
          {[0, 1, 2].map((i) => (
            <mesh key={i}>
              <sphereGeometry args={[radius * 0.57, 8, 8]} />
              <meshBasicMaterial color="#f2fcff" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
function Laboratory() {
  return (
    <group>
      <mesh position={[0, 2.3, -5.5]}>
        <planeGeometry args={[28, 9]} />
        <meshStandardMaterial color="#e8f0f3" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
        <planeGeometry args={[35, 30]} />
        <meshStandardMaterial color="#e4ecef" roughness={0.7} />
      </mesh>
      {[-7, -3, 1, 5, 9].map((x) => (
        <group key={x} position={[x, 3, -5.3]}>
          <mesh>
            <boxGeometry args={[3.75, 4.5, 0.08]} />
            <meshStandardMaterial color="#f3fcff" emissive="#d3ecf8" emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.06, 4.5, 0.07]} />
            <meshStandardMaterial color="#bfced4" />
          </mesh>
          <mesh position={[0, -0.5, 0.06]}>
            <boxGeometry args={[3.75, 0.055, 0.07]} />
            <meshStandardMaterial color="#bfced4" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.55, -4]}>
        <boxGeometry args={[24, 0.15, 1.8]} />
        <meshStandardMaterial color="#bdccd1" metalness={0.5} roughness={0.4} />
      </mesh>
      {[-6, -3, 0, 3, 6].map((x) => (
        <mesh key={x} position={[x, -0.9, -4]}>
          <boxGeometry args={[2.8, 0.6, 1.65]} />
          <meshStandardMaterial color="#f5f8fa" />
        </mesh>
      ))}
    </group>
  );
}
function CameraRig({
  preset,
  explode,
  selected,
  reset,
}: {
  preset: string;
  explode: boolean;
  selected: PartId | null;
  reset: number;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, invalidate, size } = useThree();
  const focusedPart = preset === 'Focus' ? selected : null;
  useEffect(() => {
    const aspect = size.width / size.height;
    const center = new Vector3(0, 0.65, 0);
    let position: Vec = [-2.5, 3.3, 8.1];
    if (preset === 'Top') position = [0, 10, 0.01];
    else if (preset === 'Front') position = [0, 1.6, 9.2];
    else if (preset === 'Isometric') position = [-5, 4.4, 8.2];
    else if (focusedPart && focusedPart !== 'tubes') {
      center.set(...LAYOUT[focusedPart].at).add(new Vector3(0, 0.65, 0));
      position = [center.x + 0.8, center.y + 1.2, center.z + 3.3];
    }
    if (!['Focus', 'Top'].includes(preset)) {
      const scale = Math.max(1, 1.9 / aspect) * (explode ? 1.14 : 1);
      position = [position[0] * scale, 0.65 + (position[1] - 0.65) * scale, position[2] * scale];
    }
    camera.position.set(...position);
    controls.current?.target.copy(center);
    controls.current?.update();
    camera.lookAt(center);
    invalidate();
  }, [preset, explode, reset, camera, invalidate, size.width, size.height, focusedPart]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={[0, 0.65, 0]}
      enableDamping
      minDistance={2}
      maxDistance={24}
      maxPolarAngle={Math.PI / 2.03}
    />
  );
}
function Apparatus({
  explode,
  labels,
  flow,
  thermal,
  selected,
  select,
  hidden,
  concept,
  hiddenParts,
}: {
  explode: boolean;
  labels: boolean;
  flow: boolean;
  thermal: boolean;
  selected: PartId | null;
  select: (id: PartId) => void;
  hidden: boolean;
  concept: boolean;
  hiddenParts: PartId[];
}) {
  const { telemetry: t, mode, now, receivedAt } = useRuntime();
  const quality = useSettings((s) => s.quality),
    reduced = useSettings((s) => s.reducedMotion);
  const active =
    mode !== 'DISCONNECTED' && (mode === 'REPLAY' || now - receivedAt <= SAFETY.staleMs);
  const heater = active && t?.heater === 1 && !t.fault;
  const runningFlow = active && flow && !reduced && !hidden && !explode;
  const props = { explode, labels, selected, select, hiddenParts };
  const routes = useMemo<Vec[][]>(() => {
    // Tube endpoints are the actual model fitting centers. Exploded paths follow
    // the same named transforms as the equipment instead of hanging in space.
    const at = (id: keyof typeof LAYOUT, offset: Vec): Vec =>
      LAYOUT[id].at.map((v, i) => v + offset[i] + (explode ? LAYOUT[id].explode[i] : 0)) as Vec;
    return [
      [
        at('pump', [0.25, 0.87, 0]),
        [-0.32, 0.63, 0.95],
        [-0.78, 0.6, 0.62],
        at('coldplate', [0.69, 0.68, 0]),
      ],
      [
        at('coldplate', [-0.69, 0.68, 0]),
        [-2.13, 1.12, -0.6],
        [-0.5, 1.2, -0.63],
        [0.08, 0.9, -0.3],
        at('exchanger', [-0.69, 0.68, 0]),
      ],
      [
        at('exchanger', [0.69, 0.68, 0]),
        [1.82, 0.56, 0.55],
        [1.2, 0.28, 1.13],
        [0.28, 0.27, 1.2],
        at('pump', [-0.48, 0.87, 0]),
      ],
    ];
  }, [explode]);
  const tint = concept
    ? '#95ce39'
    : thermal && active && t?.temp != null
      ? new Color('#b1e9ee').lerp(
          new Color('#e8d9a4'),
          Math.max(0, Math.min(1, (t.temp - 25) / 15)),
        )
      : '#b9e7ed';
  return (
    <>
      <EquipmentAsset name="platform" quality={quality} />
      <Part id="heater" {...props}>
        <EquipmentAsset name="heater" active={heater} quality={quality} />
        <pointLight
          position={[0, 0.9, 0]}
          color="#ff7a21"
          intensity={heater ? 1.5 : 0}
          distance={2}
        />
      </Part>
      <Part id="coldplate" {...props}>
        <EquipmentAsset name="heat-block" quality={quality} />
      </Part>
      <Part id="pump" {...props}>
        <EquipmentAsset name="pump-r385" quality={quality} />
      </Part>
      <Part id="exchanger" {...props}>
        <EquipmentAsset name="heat-block" quality={quality} />
        {/* Isolated stainless transfer loop, shown reaching into the water vessel. */}
        <Tube
          wire
          color="#afc4cb"
          radius={0.035}
          points={[
            [0.18, 1.02, -0.2],
            [0.35, 1.56, -0.2],
            [1.03, 1.56, -0.2],
            [1.12, 0.33, -0.2],
            [1.48, 0.27, -0.2],
            [1.56, 1.56, -0.2],
            [0.53, 1.63, -0.2],
            [0.2, 1.02, 0.2],
          ]}
        />
      </Part>
      <Part id="reactor" {...props}>
        <group scale={[1.15, 1.08, 1.15]}>
          <EquipmentAsset name="reactor" quality={quality} />
        </group>
        <mesh position={[0, 0.64, 0]} renderOrder={3}>
          <cylinderGeometry args={[0.508, 0.49, 1, 64]} />
          <meshPhysicalMaterial
            color={tint}
            transparent
            opacity={concept ? 0.62 : 0.38}
            roughness={0.1}
            metalness={0}
            depthWrite={false}
            side={2}
          />
        </mesh>
        <mesh position={[0, 1.145, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.508, 64]} />
          <meshPhysicalMaterial
            color={tint}
            transparent
            opacity={0.38}
            roughness={0.08}
            metalness={0.1}
            side={2}
            depthWrite={false}
          />
        </mesh>
        <Html
          position={[0, 1.25, 0.54]}
          center
          zIndexRange={[2, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <span className="scene-reading">
            {active && t?.temp != null ? `${t.temp.toFixed(1)} °C` : 'No telemetry'}
            <small>{mode === 'SIMULATED' ? 'SIMULATED' : 'Reactor temperature'}</small>
          </span>
        </Html>
      </Part>
      <Part id="probe" {...props}>
        <EquipmentAsset name="probe" quality={quality} />
      </Part>
      <Part id="gas" {...props}>
        <EquipmentAsset name="mq135" quality={quality} />
      </Part>
      <Part id="esp32" {...props}>
        <EquipmentAsset name="esp32" active={active} quality={quality} />
      </Part>
      <Part id="relay" {...props}>
        <EquipmentAsset name="relay" quality={quality} />
      </Part>
      <Part id="supply" {...props}>
        <EquipmentAsset name="supply" quality={quality} />
      </Part>
      <group
        onClick={(e) => {
          e.stopPropagation();
          select('tubes');
        }}
      >
        {routes.map((points, i) => (
          <Tube key={i} points={points} warm={i === 1} flow={runningFlow} />
        ))}
      </group>
      <Tube
        wire
        radius={0.018}
        color="#172b33"
        points={[
          [2.64, 1.4, -0.06],
          [2.66, 1.82, -0.08],
          [3.12, 1.7, -0.1],
          [3.2, 0.25, 0.7],
          [3.4, 0.23, 0.6],
        ]}
      />
      <Tube
        wire
        radius={0.012}
        color="#00a878"
        points={[
          [3.62, 0.95, -0.57],
          [4.07, 0.6, -0.5],
          [4.13, 0.17, 0.4],
          [3.9, 0.24, 0.7],
        ]}
      />
      <Tube
        wire
        radius={0.011}
        color="#d5a12d"
        points={[
          [3.42, 0.24, 0.65],
          [3.2, 0.06, -0.85],
          [0.22, 0.07, -1.02],
        ]}
      />
      <Tube
        wire
        radius={0.02}
        color="#202a30"
        points={[
          [-3.8, 0.3, -0.35],
          [-3.8, 0.1, -0.9],
          [-2.3, 0.06, -1.02],
          [0.1, 0.1, -1.02],
        ]}
      />
      <Tube
        wire
        radius={0.033}
        color="#1b252b"
        points={[
          [3.65, 0.23, 1.46],
          [3.55, 0.13, 1.8],
          [3.1, -0.35, 2.4],
          [2.8, -0.65, 3.1],
        ]}
      />
    </>
  );
}
export default function TwinScene({
  expanded = false,
  hero = false,
}: {
  expanded?: boolean;
  hero?: boolean;
}) {
  const [explode, setExplode] = useState(false),
    [preset, setPreset] = useState('Normal'),
    [reset, setReset] = useState(0),
    [selected, setSelected] = useState<PartId | null>(null),
    [labels, setLabels] = useState(true),
    [flow, setFlow] = useState(true),
    [thermal, setThermal] = useState(true),
    [concept, setConcept] = useState(false),
    [hiddenParts, setHiddenParts] = useState<PartId[]>([]),
    [hidden, setHidden] = useState(document.hidden);
  const quality = useSettings((s) => s.quality),
    mode = useRuntime((s) => s.mode),
    t = useRuntime((s) => s.telemetry),
    receivedAt = useRuntime((s) => s.receivedAt),
    viewStatus = useRuntime(connectionStatus);
  const ref = useRef<HTMLDivElement>(null);
  const [supported] = useState(() => {
    try {
      return !!document.createElement('canvas').getContext('webgl2');
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const fn = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  }, []);
  return (
    <section
      ref={ref}
      className={`panel twin-panel ${expanded ? 'expanded' : ''} ${hero ? 'hero-scene' : ''} mode-${mode.toLowerCase()}`}
      aria-label="Interactive 3D digital twin"
    >
      <div className="panel-heading">
        <span className="icon-tile">
          <BoxIcon />
        </span>
        <div>
          <h2>3D Digital Twin</h2>
          <p>Live representation of the physical system</p>
        </div>
        <div className="scene-toolbar">
          <span>View:</span>
          {['Normal', 'Exploded', 'Top'].map((item) => (
            <button
              key={item}
              aria-pressed={item === 'Exploded' ? explode : preset === item && !explode}
              className={
                (item === 'Exploded' ? explode : preset === item && !explode) ? 'active' : ''
              }
              onClick={() => {
                setExplode(item === 'Exploded');
                if (item !== 'Exploded') setPreset(item);
              }}
            >
              {item}
            </button>
          ))}
          <button
            aria-label="Reset camera"
            onClick={() => {
              setPreset('Normal');
              setReset((v) => v + 1);
              setExplode(false);
            }}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
      <div className="scene-canvas">
        {supported ? (
          <Canvas
            shadows={quality !== 'low'}
            dpr={[1, quality === 'high' ? 1.6 : quality === 'low' ? 1 : 1.3]}
            frameloop={hidden ? 'never' : 'demand'}
            camera={{ position: [0.35, 3.2, 8.6], fov: 35, near: 0.1, far: 60 }}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
          >
            <color attach="background" args={['#eaf2f5']} />
            <fog attach="fog" args={['#eaf2f5', 12, 35]} />
            <hemisphereLight args={['#ffffff', '#a8b7be', 2.1]} />
            <directionalLight
              position={[-3, 6, 4]}
              intensity={3.5}
              castShadow
              shadow-mapSize={[quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024]}
              shadow-camera-left={-6}
              shadow-camera-right={6}
              shadow-camera-top={5}
              shadow-camera-bottom={-4}
              shadow-bias={-0.0005}
            />
            <directionalLight position={[5, 4, -3]} intensity={2.2} color="#e8f7ff" />
            <Environment resolution={128} frames={1}>
              <mesh>
                <sphereGeometry args={[30, 16, 16]} />
                <meshBasicMaterial color="#ccd9e0" side={BackSide} />
              </mesh>
              <Lightformer
                intensity={2.8}
                position={[0, 5, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                scale={[10, 4, 1]}
              />
              <Lightformer
                intensity={2}
                position={[0, 2, 7]}
                rotation={[0, Math.PI, 0]}
                scale={[15, 7, 1]}
              />
              <Lightformer
                intensity={2.5}
                position={[-6, 2, 2]}
                rotation={[0, Math.PI / 2, 0]}
                scale={[4, 5, 1]}
              />
              <Lightformer
                intensity={2}
                position={[5, 3, -2]}
                rotation={[0, -Math.PI / 3, 0]}
                scale={[5, 3, 1]}
              />
            </Environment>
            <CameraRig preset={preset} explode={explode} selected={selected} reset={reset} />
            <Laboratory />
            <Suspense fallback={null}>
              <Apparatus
                {...{ explode, labels, flow, thermal, selected, hidden, concept, hiddenParts }}
                select={setSelected}
              />
            </Suspense>
            {quality === 'high' && (
              <ContactShadows
                position={[0, -0.285, 0]}
                opacity={0.3}
                scale={14}
                blur={2.4}
                far={4}
                frames={1}
                resolution={512}
              />
            )}
          </Canvas>
        ) : (
          <div className="empty">
            <BoxIcon size={42} />
            <h3>3D requires WebGL 2</h3>
            <p>Enable browser hardware acceleration to view the apparatus.</p>
          </div>
        )}
        <div className="scene-legend">
          <span>
            <i className="line warm" /> Hot coolant · illustrative
          </span>
          <span>
            <i className="line cool" /> Cool return · flow not instrumented
          </span>
          <span>
            <i className="line green" /> Sensor data
          </span>
          <span>
            <i className="line gold" /> Control signal
          </span>
        </div>
        <div className="scene-tools">
          <button
            aria-label="Toggle component labels"
            aria-pressed={labels}
            onClick={() => setLabels(!labels)}
          >
            <Eye size={17} />
          </button>
          <button
            aria-label="Toggle illustrative flow"
            aria-pressed={flow}
            onClick={() => setFlow(!flow)}
          >
            <Layers size={17} />
          </button>
          <button
            aria-label="Fullscreen digital twin"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else void ref.current?.requestFullscreen().catch(() => {});
            }}
          >
            <Maximize size={17} />
          </button>
        </div>
        {viewStatus !== 'LIVE' && (
          <span className={`scene-source ${mode.toLowerCase()}`}>
            {viewStatus === 'AWAITING TELEMETRY' || viewStatus === 'STALE' || viewStatus === 'FAULT'
              ? viewStatus
              : mode === 'DISCONNECTED'
                ? 'OFFLINE · NO TELEMETRY'
                : mode === 'SIMULATED'
                  ? 'SIMULATED APPARATUS'
                  : 'REPLAY · RECORDED SESSION'}
          </span>
        )}
        {concept && <span className="scene-concept">CONCEPT COLOR · NO VERIFIED CULTURE</span>}
        {selected && (
          <aside className="component-inspector">
            <button
              className="close"
              aria-label="Close component inspector"
              onClick={() => setSelected(null)}
            >
              <X size={16} />
            </button>
            <h3>{PARTS[selected].name}</h3>
            <strong>{PARTS[selected].spec}</strong>
            <p>{PARTS[selected].role}</p>
            <p>{PARTS[selected].connections}</p>
            <p className="warning-text">{PARTS[selected].hazard}</p>
            <p>
              Source: {mode} · {t?.fault ? faultNames(t.fault).join(', ') : 'No reported fault'}
            </p>
            <p>
              Last received:{' '}
              {receivedAt ? new Date(receivedAt).toLocaleTimeString() : 'Unavailable'} ·{' '}
              {viewStatus}
            </p>
            {selected === 'probe' && (
              <p>
                Reactor: {t?.temp ?? 'Unavailable'} {t?.temp != null ? '°C' : ''}
              </p>
            )}
            {selected === 'gas' && <p>Relative raw ADC: {t?.gas ?? 'Unavailable'}</p>}
            <button
              onClick={() => {
                setPreset('Focus');
                setReset((v) => v + 1);
              }}
            >
              <Focus size={14} /> Focus component
            </button>
            {selected !== 'tubes' && (
              <button
                onClick={() =>
                  setHiddenParts((parts) =>
                    parts.includes(selected)
                      ? parts.filter((id) => id !== selected)
                      : [...parts, selected],
                  )
                }
              >
                {hiddenParts.includes(selected) ? 'Show component' : 'Hide component'}
              </button>
            )}
          </aside>
        )}
      </div>
      {expanded && (
        <div className="scene-options">
          <label>
            <input
              type="checkbox"
              checked={thermal}
              onChange={(e) => setThermal(e.target.checked)}
            />{' '}
            Temperature tint
          </label>
          <label>
            <input
              type="checkbox"
              checked={concept}
              onChange={(e) => setConcept(e.target.checked)}
            />{' '}
            Reference green · conceptual
          </label>
          <label>
            Camera
            <select value={preset} onChange={(e) => setPreset(e.target.value)}>
              {['Normal', 'Front', 'Top', 'Isometric', 'Focus'].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Inspect component
            <select
              value={selected ?? ''}
              onChange={(e) => setSelected((e.target.value as PartId) || null)}
            >
              <option value="">Select a component</option>
              {Object.entries(PARTS).map(([id, p]) => (
                <option key={id} value={id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </section>
  );
}
