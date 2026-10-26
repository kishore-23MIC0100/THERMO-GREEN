import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Html,
  OrbitControls,
  ContactShadows,
  RoundedBox,
  Environment,
  Lightformer,
} from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import {
  CatmullRomCurve3,
  Color,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  Mesh,
  Vector3,
  Group,
} from 'three';
import { Maximize, RotateCcw, Layers, Box as BoxIcon, X, Eye } from 'lucide-react';
import { PARTS, type PartId } from './parts';
import { useRuntime } from '../stores/runtime';
import { useSettings } from '../stores/settings';
import { SAFETY } from '../lib/config';

type Vec = [number, number, number];
function Box({
  position = [0, 0, 0],
  size,
  color = '#8b9aab',
  metal = 0.7,
  emissive = '#000000',
  children,
}: {
  position?: Vec;
  size: Vec;
  color?: string;
  metal?: number;
  emissive?: string;
  children?: ReactNode;
}) {
  return (
    <RoundedBox
      position={position}
      args={size}
      radius={Math.min(...size) * 0.12}
      smoothness={2}
      bevelSegments={2}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        metalness={metal}
        roughness={0.32}
        emissive={emissive}
        emissiveIntensity={0.45}
      />
      {children}
    </RoundedBox>
  );
}
function Cylinder({
  position = [0, 0, 0],
  radius,
  height,
  color = '#8495a5',
  rotation = [0, 0, 0],
  metal = 0.7,
}: {
  position?: Vec;
  radius: number;
  height: number;
  color?: string;
  rotation?: Vec;
  metal?: number;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <cylinderGeometry args={[radius, radius, height, 24]} />
      <meshStandardMaterial color={color} metalness={metal} roughness={0.32} />
    </mesh>
  );
}
function Repeated({ positions, size, color }: { positions: Vec[]; size: Vec; color: string }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    positions.forEach((p, i) => ref.current!.setMatrixAt(i, new Matrix4().makeTranslation(...p)));
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [positions]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, positions.length]} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={0.75} roughness={0.3} />
    </instancedMesh>
  );
}
function Part({
  id,
  position,
  offset,
  explode,
  select,
  selected,
  labels,
  children,
}: {
  id: PartId;
  position: Vec;
  offset?: Vec;
  explode: boolean;
  select: (id: PartId) => void;
  selected: PartId | null;
  labels: boolean;
  children: ReactNode;
}) {
  const ref = useRef<Group>(null),
    [hover, setHover] = useState(false);
  const { invalidate } = useThree();
  const target = useMemo(
    () => new Vector3(...position).add(new Vector3(...(explode && offset ? offset : [0, 0, 0]))),
    [position, offset, explode],
  );
  useEffect(() => {
    invalidate();
  }, [target, invalidate]);
  useFrame((_, dt) => {
    if (ref.current && ref.current.position.distanceTo(target) > 0.001) {
      ref.current.position.lerp(target, Math.min(dt * 10, 1));
      invalidate();
    }
  });
  return (
    <group
      ref={ref}
      position={position}
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
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.4, 0.43, 40]} />
          <meshBasicMaterial color={selected === id ? '#00e5a0' : '#22d3ee'} side={DoubleSide} />
        </mesh>
      )}
      {((labels && !['probe', 'exchanger', 'relay', 'supply'].includes(id)) || hover) && (
        <Html
          position={[0, id === 'reactor' ? 1.25 : 0.8, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div className="part-label">{PARTS[id].name}</div>
        </Html>
      )}
    </group>
  );
}
function Tube({
  points,
  color = '#22d3ee',
  radius = 0.04,
  flow = false,
  hidden = false,
}: {
  points: Vec[];
  color?: string;
  radius?: number;
  flow?: boolean;
  hidden?: boolean;
}) {
  const curve = useMemo(() => new CatmullRomCurve3(points.map((p) => new Vector3(...p))), [points]);
  const dot = useRef<Mesh>(null);
  const phase = useRef(0);
  const { invalidate } = useThree();
  useFrame((_, dt) => {
    if (flow && !hidden && dot.current) {
      phase.current = (phase.current + dt * 0.15) % 1;
      dot.current.position.copy(curve.getPoint(phase.current));
      invalidate();
    }
  });
  useEffect(() => {
    if (flow) invalidate();
  }, [flow, invalidate]);
  return (
    <>
      <mesh>
        <tubeGeometry args={[curve, 64, radius, 10, false]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.2}
          metalness={0.1}
          clearcoat={1}
          transparent
          opacity={0.68}
        />
      </mesh>
      {flow && (
        <mesh ref={dot}>
          <sphereGeometry args={[radius * 0.8, 8, 8]} />
          <meshBasicMaterial color="#d9f5eb" />
        </mesh>
      )}
    </>
  );
}
function Camera({ preset }: { preset: string }) {
  const { camera, invalidate, size } = useThree();
  useEffect(() => {
    const p: Vec =
      preset === 'Top'
        ? [0, 6.8, 0.01]
        : preset === 'Front'
          ? [0, 2, 6.6]
          : preset === 'Reactor'
            ? [3.2, 2.8, 3.2]
            : preset === 'Electronics'
              ? [2.6, 3, 1.1]
              : size.width / size.height > 1.6
                ? [-3.3, 2.1, 3.9]
                : [-4.4, 3.0, 5.3];
    camera.position.set(...p);
    camera.lookAt(0, 0.4, 0);
    invalidate();
  }, [preset, camera, invalidate, size.width, size.height]);
  return (
    <OrbitControls
      makeDefault
      target={[0, 0.35, 0]}
      enableDamping
      minDistance={2.2}
      maxDistance={10}
      maxPolarAngle={Math.PI / 2.05}
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
}: {
  explode: boolean;
  labels: boolean;
  flow: boolean;
  thermal: boolean;
  selected: PartId | null;
  select: (id: PartId) => void;
  hidden: boolean;
}) {
  const { telemetry: t, mode, now, receivedAt } = useRuntime();
  const quality = useSettings((s) => s.quality);
  const reduced = useSettings((s) => s.reducedMotion);
  const fresh = mode === 'REPLAY' || now - receivedAt <= SAFETY.staleMs;
  const active = mode !== 'DISCONNECTED' && fresh;
  const heater = active && t?.heater === 1 && !t.fault;
  const tint =
    active && t?.temp != null && thermal
      ? new Color('#22b9d0').lerp(
          new Color('#ff8a3d'),
          Math.max(0, Math.min(1, (t.temp - 20) / 16)),
        )
      : new Color('#9ab0c3');
  const props = { explode, labels, selected, select };
  return (
    <>
      <Box position={[0, -0.11, 0]} size={[4.8, 0.13, 2.65]} color="#52636d" />
      <Box position={[0, -0.2, 0]} size={[4.85, 0.08, 2.7]} color="#17212c" />
      <Repeated
        positions={[-2.15, 2.15].flatMap((x) => [-1.05, 1.05].map((z) => [x, -0.28, z] as Vec))}
        size={[0.18, 0.15, 0.18]}
        color="#151e27"
      />
      <Part id="heater" position={[-1.55, 0, 0]} offset={[-0.3, 0.3, 0]} {...props}>
        <Box position={[0, 0.16, 0]} size={[0.95, 0.25, 0.76]} color="#111f2b" />
        <Repeated
          positions={Array.from({ length: 12 }, (_, i) => [-0.42 + i * 0.076, 0.32, 0] as Vec)}
          size={[0.025, 0.18, 0.73]}
          color="#adbdc6"
        />
        <Box
          position={[0, 0.43, 0]}
          size={[0.66, 0.05, 0.62]}
          color={heater ? '#e99b48' : '#a0a9a8'}
          emissive={heater ? '#ff8a3d' : '#000000'}
        />
        <Box position={[-0.54, 0.39, 0]} size={[0.1, 0.76, 0.75]} color="#172632" />
        <Cylinder
          position={[-0.6, 0.4, 0]}
          rotation={[0, 0, Math.PI / 2]}
          radius={0.26}
          height={0.05}
          color="#070f16"
        />
        {heater && (
          <Html position={[0, 0.72, 0]} center>
            <span className="scene-reading warm">Relay reported ON</span>
          </Html>
        )}
      </Part>
      <Part id="coldplate" position={[-1.48, 0.47, 0]} offset={[0, 0.58, 0]} {...props}>
        <Box position={[0, 0.1, 0]} size={[0.4, 0.2, 0.4]} color="#c4d2db" />
        <Repeated
          positions={[-0.14, 0.14].flatMap((x) => [-0.14, 0.14].map((z) => [x, 0.21, z] as Vec))}
          size={[0.035, 0.035, 0.035]}
          color="#3e4a55"
        />
        <Cylinder
          position={[0.25, 0.1, -0.13]}
          rotation={[0, 0, Math.PI / 2]}
          radius={0.06}
          height={0.15}
        />
        <Cylinder
          position={[0.25, 0.1, 0.13]}
          rotation={[0, 0, Math.PI / 2]}
          radius={0.06}
          height={0.15}
        />
      </Part>
      <Part id="pump" position={[-0.2, 0.08, 0.75]} offset={[0, 0.1, 0.45]} {...props}>
        <Cylinder
          position={[0, 0.17, 0]}
          rotation={[0, 0, Math.PI / 2]}
          radius={0.19}
          height={0.56}
          color="#182a32"
        />
        <Cylinder
          position={[-0.31, 0.17, 0]}
          rotation={[0, 0, Math.PI / 2]}
          radius={0.21}
          height={0.12}
          color="#0c1821"
        />
        <Cylinder position={[-0.31, 0.38, 0]} radius={0.07} height={0.15} color="#131e27" />
        <Cylinder position={[0.22, 0.35, 0]} radius={0.06} height={0.15} />
        <Box position={[0, 0.015, 0]} size={[0.55, 0.08, 0.42]} color="#13232d" />
        <Repeated
          positions={Array.from({ length: 7 }, (_, i) => [-0.22 + i * 0.07, 0.17, 0] as Vec)}
          size={[0.012, 0.39, 0.28]}
          color="#23383d"
        />
      </Part>
      <Part id="reactor" position={[1.1, 0, 0]} offset={[0.55, 0.2, 0]} {...props}>
        <mesh position={[0, 0.49, 0]}>
          <cylinderGeometry args={[0.37, 0.35, 0.96, 48, 1, true]} />
          <meshPhysicalMaterial
            color="#e1f7ff"
            roughness={0.08}
            metalness={0.03}
            transmission={quality === 'low' ? 0 : 0.93}
            transparent
            opacity={quality === 'low' ? 0.18 : 0.75}
            thickness={0.025}
            side={DoubleSide}
          />
        </mesh>
        <Cylinder
          position={[0, 0.025, 0]}
          radius={0.35}
          height={0.04}
          color="#9fbec8"
          metal={0.25}
        />
        <mesh position={[0, 0.36, 0]}>
          <cylinderGeometry args={[0.335, 0.325, 0.62, 48]} />
          <meshPhysicalMaterial
            color={tint}
            transparent
            opacity={0.26}
            transmission={quality === 'low' ? 0 : 0.45}
            roughness={0.16}
            metalness={0.02}
          />
        </mesh>
        <mesh position={[0, 0.97, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.36, 0.015, 8, 48]} />
          <meshStandardMaterial color="#d3ebf3" metalness={0.7} roughness={0.1} />
        </mesh>
        <Html position={[0, 0.75, 0.36]} center>
          <span className="scene-reading">
            {active && t?.temp != null ? `${t.temp.toFixed(1)} °C` : 'Unavailable'}
            <small>250 mL reactor</small>
          </span>
        </Html>
      </Part>
      <Part id="exchanger" position={[1.1, 0.08, 0]} offset={[0.55, 0.5, 0]} {...props}>
        <Box position={[0, 0.1, 0]} size={[0.35, 0.2, 0.25]} color="#9faeb8" />
        <Cylinder position={[-0.12, 0.4, 0]} radius={0.035} height={0.6} />
        <Cylinder position={[0.12, 0.4, 0]} radius={0.035} height={0.6} />
      </Part>
      <Part id="probe" position={[1.33, 0.55, -0.06]} offset={[0.55, 0.6, 0]} {...props}>
        <Cylinder radius={0.023} height={0.66} color="#d3dfe1" />
        <Cylinder position={[0, 0.37, 0]} radius={0.035} height={0.13} color="#0e1924" />
      </Part>
      <Part id="gas" position={[1.75, 0.62, -0.5]} offset={[0.3, 0.4, -0.25]} {...props}>
        <Box size={[0.24, 0.04, 0.36]} color="#13646d" />
        <Cylinder position={[0, 0.09, 0]} radius={0.08} height={0.15} color="#a3b3b9" />
        <Cylinder position={[0, -0.3, 0]} radius={0.024} height={0.56} color="#233440" />
      </Part>
      <Part id="esp32" position={[1.8, 0.05, 0.83]} offset={[0.3, 0.15, 0.4]} {...props}>
        <Box size={[0.45, 0.04, 0.8]} color="#173b36" />
        <Box position={[0, 0.06, -0.1]} size={[0.3, 0.1, 0.35]} color="#8c9ba5" />
        <Box position={[0, 0.05, 0.26]} size={[0.16, 0.08, 0.1]} color="#293441" />
        <Repeated
          positions={[-0.19, 0.19].flatMap((x) =>
            Array.from({ length: 14 }, (_, i) => [x, 0.05, -0.32 + i * 0.048] as Vec),
          )}
          size={[0.025, 0.09, 0.025]}
          color="#c5a66a"
        />
        <Box position={[0, 0.04, -0.33]} size={[0.24, 0.035, 0.12]} color="#101b22" />
        <Box position={[0, 0.045, 0.41]} size={[0.15, 0.07, 0.12]} color="#9aaab6" />
        <mesh position={[0.12, 0.07, 0.2]}>
          <sphereGeometry args={[0.017, 8, 8]} />
          <meshBasicMaterial color={active ? '#00e5a0' : '#314554'} />
        </mesh>
      </Part>
      <Part id="relay" position={[0.4, 0.06, -0.85]} offset={[0, 0.3, -0.4]} {...props}>
        <Box size={[0.5, 0.04, 0.32]} color="#15646a" />
        <Box position={[0, 0.12, 0]} size={[0.26, 0.2, 0.24]} color="#136c9d" />
        <Box position={[-0.2, 0.07, 0]} size={[0.09, 0.12, 0.27]} color="#238975" />
      </Part>
      <Part id="supply" position={[-1.55, 0.16, -0.85]} offset={[-0.3, 0.1, -0.3]} {...props}>
        <Box size={[0.72, 0.29, 0.45]} color="#33434c" />
        <Repeated
          positions={Array.from({ length: 6 }, (_, i) => [-0.25 + i * 0.1, 0.15, 0] as Vec)}
          size={[0.025, 0.01, 0.32]}
          color="#132531"
        />
      </Part>
      <group
        onClick={(e) => {
          e.stopPropagation();
          select('tubes');
        }}
      >
        <Tube
          points={[
            [-0.51, 0.52, 0.75],
            [-0.85, 0.52, 0.7],
            [-1, 0.6, 0.25],
            [-1.2, 0.57, 0.13],
          ]}
          flow={active && flow && !reduced && !explode}
          hidden={hidden}
        />
        <Tube
          points={[
            [-1.2, 0.57, -0.13],
            [-0.6, 0.7, -0.35],
            [0.25, 0.85, -0.35],
            [0.98, 0.8, 0],
            [0.98, 0.5, 0],
          ]}
          color={thermal ? '#ff8a3d' : '#22d3ee'}
          flow={active && flow && !reduced && !explode}
          hidden={hidden}
        />
        <Tube
          points={[
            [1.22, 0.5, 0],
            [1.22, 0.8, 0.2],
            [0.95, 0.25, 0.7],
            [0.35, 0.2, 1.05],
            [0.02, 0.5, 0.75],
          ]}
          flow={active && flow && !reduced && !explode}
          hidden={hidden}
        />
      </group>
      <Tube
        radius={0.012}
        color="#e6b93d"
        points={[
          [1.33, 0.92, -0.06],
          [1.4, 1.15, -0.12],
          [1.85, 0.8, 0.2],
          [1.99, 0.15, 0.7],
        ]}
      />
      <Tube
        radius={0.012}
        color="#00e5a0"
        points={[
          [1.75, 0.6, -0.5],
          [2.1, 0.6, -0.4],
          [2.1, 0.1, 0.3],
          [1.95, 0.1, 0.6],
        ]}
      />
      <Tube
        radius={0.012}
        color="#e6b93d"
        points={[
          [1.6, 0.1, 0.6],
          [1.5, 0.07, -0.65],
          [0.4, 0.13, -0.85],
        ]}
      />
      <Tube
        radius={0.014}
        color="#ed6b67"
        points={[
          [-1.2, 0.3, -0.85],
          [-0.5, 0.08, -1.1],
          [0.4, 0.1, -0.85],
        ]}
      />
      <Tube
        radius={0.014}
        color="#e78b52"
        points={[
          [0.2, 0.1, -0.85],
          [-0.8, 0.12, -0.65],
          [-1.7, 0.18, 0.3],
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
    [selected, setSelected] = useState<PartId | null>(null),
    [labels, setLabels] = useState(true),
    [flow, setFlow] = useState(true),
    [thermal, setThermal] = useState(true),
    [hidden, setHidden] = useState(document.hidden);
  const quality = useSettings((s) => s.quality),
    mode = useRuntime((s) => s.mode);
  const ref = useRef<HTMLDivElement>(null);
  const t = useRuntime((s) => s.telemetry);
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
          <p>Thermal test vehicle & closed coolant loop</p>
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
              setPreset((p) => (p === 'Normal' ? 'Reset' : 'Normal'));
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
            shadows={quality === 'high'}
            dpr={[1, quality === 'low' ? 1 : 1.75]}
            frameloop={hidden ? 'never' : 'demand'}
            camera={{ position: [-4.4, 3, 5.3], fov: 37 }}
            gl={{ antialias: quality !== 'low', powerPreference: 'high-performance' }}
          >
            <color attach="background" args={['#071724']} />
            <hemisphereLight args={['#d3f5ff', '#243244', 2]} />
            <directionalLight
              position={[-3, 5, 3]}
              intensity={4}
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            <directionalLight position={[3, 4, -2]} intensity={3} color="#82cddd" />
            <spotLight position={[1, 5, 4]} intensity={30} angle={0.8} penumbra={0.6} />
            <Environment resolution={128} frames={1}>
              <Lightformer
                intensity={3}
                position={[0, 5, -2]}
                rotation={[Math.PI / 2, 0, 0]}
                scale={[10, 6, 1]}
              />
              <Lightformer
                intensity={2}
                position={[-5, 2, 0]}
                rotation={[0, Math.PI / 2, 0]}
                scale={[6, 4, 1]}
              />
              <Lightformer
                intensity={1}
                position={[5, 1, 0]}
                rotation={[0, -Math.PI / 2, 0]}
                scale={[3, 3, 1]}
              />
            </Environment>
            <Camera preset={preset} />
            <Apparatus
              explode={explode}
              labels={labels}
              flow={flow}
              thermal={thermal}
              selected={selected}
              select={setSelected}
              hidden={hidden}
            />
            {quality === 'high' && (
              <>
                <ContactShadows
                  position={[0, -0.36, 0]}
                  opacity={0.4}
                  scale={10}
                  blur={2}
                  far={3}
                  frames={1}
                />
                <EffectComposer>
                  <Bloom intensity={0.15} luminanceThreshold={1} />
                </EffectComposer>
              </>
            )}
          </Canvas>
        ) : (
          <div className="empty">
            <BoxIcon size={42} />
            <h3>3D requires WebGL 2</h3>
            <p>
              Enable browser hardware acceleration. All controls, telemetry and component details
              remain available below.
            </p>
          </div>
        )}
        <div className="scene-legend">
          <span>
            <i className="line warm" /> Heat transfer path · illustrative
          </span>
          <span>
            <i className="line cool" /> Coolant return · flow not instrumented
          </span>
          <span>
            <i className="line green" /> Sensor data
          </span>
          <span>
            <i className="line gold" /> Control / power wiring
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
        {mode !== 'LIVE' && (
          <span className={`scene-source ${mode.toLowerCase()}`}>
            {mode === 'DISCONNECTED'
              ? 'OFFLINE · NO TELEMETRY'
              : mode === 'SIMULATED'
                ? 'SIMULATED APPARATUS'
                : 'REPLAY · RECORDED SESSION'}
          </span>
        )}
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
            {selected === 'probe' && (
              <p>
                Reactor: {t?.temp ?? 'Unavailable'} {t?.temp != null ? '°C' : ''}
              </p>
            )}
            {selected === 'gas' && <p>Relative raw ADC: {t?.gas ?? 'Unavailable'}</p>}
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
            />
            Temperature tint (20–36 °C)
          </label>
          <label>
            Camera
            <select value={preset} onChange={(e) => setPreset(e.target.value)}>
              {['Normal', 'Front', 'Top', 'Reactor', 'Electronics'].map((p) => (
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
                <option value={id} key={id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {explode && (
            <small>Separated components; tubes retain the assembled routing reference.</small>
          )}
        </div>
      )}
    </section>
  );
}
