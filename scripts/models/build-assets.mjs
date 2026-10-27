// Original AlgaeRhythm product-visualization assets. Units are illustrative,
// not manufacturing dimensions. No third-party geometry or textures are used.
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;
      this.onloadend?.();
    });
  }
};
const material = (name, color, metalness = 0, roughness = 0.4, extra = {}) =>
  new T.MeshStandardMaterial({ name, color, metalness, roughness, ...extra });
const M = {
  alu: material('satin-aluminium', '#b8c3c8', 0.92, 0.27),
  bright: material('machined-edge', '#e0e6e8', 0.95, 0.17),
  dark: material('black-anodised', '#152129', 0.65, 0.32),
  rubber: material('matte-polymer', '#182126', 0.12, 0.5),
  steel: material('stainless-steel', '#9daeb5', 0.95, 0.2),
  brass: material('plated-brass', '#bc9144', 0.85, 0.3),
  pcb: material('pcb-solder-mask', '#123c38', 0.3, 0.45),
  blue: material('blue-pcb', '#056b97', 0.15, 0.4),
  white: material('silkscreen', '#dde7e7', 0.1, 0.55),
  element: material('heater-element', '#c7a06b', 0.55, 0.3),
  led: material('power-led', '#2c5347', 0.05, 0.3),
  relay: material('relay-enclosure', '#0e79b6', 0.05, 0.38),
};
const box = (g, name, p, s, mat = M.alu, radius = 0.025) => {
  const mesh = new T.Mesh(
    Math.min(...s) < 0.035
      ? new T.BoxGeometry(...s)
      : new RoundedBoxGeometry(...s, 2, Math.min(radius, ...s.map((v) => v / 3))),
    mat,
  );
  mesh.name = name;
  mesh.position.set(...p);
  g.add(mesh);
  return mesh;
};
const cyl = (g, name, p, r, h, mat = M.steel, axis = 'y', segments = 32, r2 = r) => {
  const mesh = new T.Mesh(new T.CylinderGeometry(r2, r, h, segments), mat);
  mesh.name = name;
  mesh.position.set(...p);
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  g.add(mesh);
  return mesh;
};
const ring = (g, name, p, r, tube, mat = M.steel, axis = 'y') => {
  const mesh = new T.Mesh(new T.TorusGeometry(r, tube, 8, 48), mat);
  mesh.name = name;
  mesh.position.set(...p);
  if (axis === 'y') mesh.rotation.x = Math.PI / 2;
  if (axis === 'x') mesh.rotation.y = Math.PI / 2;
  g.add(mesh);
  return mesh;
};
function screw(g, x, y, z, axis = 'y', r = 0.035) {
  cyl(g, 'washer', [x, y, z], r * 1.4, 0.014, M.steel, axis);
  const p = axis === 'y' ? [x, y + 0.015, z] : axis === 'x' ? [x + 0.015, y, z] : [x, y, z + 0.015];
  cyl(g, 'socket-head', p, r, 0.038, M.dark, axis, 6);
  const p2 = [...p];
  p2[axis === 'y' ? 1 : axis === 'x' ? 0 : 2] += 0.022;
  cyl(g, 'hex-recess', p2, r * 0.48, 0.002, M.rubber, axis, 6);
}
function barb(g, p, axis = 'x', sign = 1) {
  const d = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  const at = (v) => {
    const a = [...p];
    a[d] += v * sign;
    return a;
  };
  cyl(g, 'port-gasket', at(0), 0.12, 0.035, M.rubber, axis);
  cyl(g, 'port-hex', at(0.055), 0.115, 0.09, M.steel, axis, 6);
  cyl(g, 'barbed-fitting', at(0.17), 0.066, 0.2, M.steel, axis);
  for (let i = 0; i < 4; i++)
    ring(g, 'hose-barb', at(0.11 + i * 0.04), 0.067, 0.011, M.steel, axis);
  cyl(g, 'port-bore', at(0.275), 0.045, 0.004, M.rubber, axis);
}
function feet(g, xs, zs, top = 0.12) {
  for (const x of xs)
    for (const z of zs) {
      cyl(g, 'mount-isolator', [x, 0.06, z], 0.09, 0.1, M.rubber);
      cyl(g, 'mount-stud', [x, top / 2 + 0.06, z], 0.035, top, M.steel);
      screw(g, x, top + 0.06, z);
    }
}
function heater() {
  const g = new T.Group();
  g.name = 'PTCHeater';
  box(g, 'mounting-rail', [0, 0.12, 0], [1.48, 0.12, 1.05], M.dark);
  feet(g, [-0.64, 0.64], [-0.42, 0.42], 0.09);
  box(g, 'heat-sink-core', [0, 0.45, 0], [1.22, 0.5, 0.86], M.dark);
  for (let i = 0; i < 17; i++)
    box(g, 'horizontal-fin', [0, 0.22 + i * 0.029, 0], [1.27, 0.013, 0.94], M.dark, 0.004);
  box(g, 'top-spreader', [0, 0.72, 0], [1.3, 0.07, 0.98], M.alu);
  box(g, 'ceramic-ptc', [0, 0.766, 0], [1.02, 0.025, 0.73], M.element, 0.008);
  for (let i = 0; i < 12; i++)
    box(g, 'ceramic-trace', [0, 0.783, -0.32 + i * 0.057], [0.97, 0.006, 0.013], M.bright, 0.002);
  for (const x of [-0.655, 0.655]) {
    box(g, 'side-cheek', [x, 0.47, 0], [0.045, 0.57, 0.97], M.alu, 0.009);
    for (const y of [0.25, 0.69]) for (const z of [-0.39, 0.39]) screw(g, x + 0.025, y, z, 'x');
  }
  const fan = new T.Group();
  fan.position.set(-0.88, 0.62, -0.04);
  g.add(fan);
  box(fan, 'fan-cage', [0, 0, 0], [0.12, 1.05, 1.02], M.dark);
  cyl(fan, 'fan-aperture', [-0.07, 0, 0], 0.43, 0.015, M.rubber, 'x');
  for (const r of [0.16, 0.25, 0.34, 0.43])
    ring(fan, 'fan-grille', [-0.085, 0, 0], r, 0.012, M.steel, 'x');
  cyl(fan, 'fan-hub', [-0.1, 0, 0], 0.105, 0.035, M.dark, 'x');
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const blade = box(
      fan,
      'fan-vane',
      [-0.077, Math.cos(a) * 0.25, Math.sin(a) * 0.25],
      [0.018, 0.25, 0.085],
      M.rubber,
      0.015,
    );
    blade.rotation.x = a + 0.45;
  }
  for (const y of [-0.43, 0.43]) for (const z of [-0.42, 0.42]) screw(fan, -0.081, y, z, 'x');
  // Front panel terminals and heat-resistant wiring glands.
  for (const z of [-0.22, 0.22]) {
    cyl(g, 'power-gland', [0.69, 0.42, z], 0.065, 0.13, M.rubber, 'x');
    ring(g, 'gland-lock', [0.7, 0.42, z], 0.063, 0.012, M.brass, 'x');
  }
  return g;
}
function block(name) {
  const g = new T.Group();
  g.name = name;
  feet(g, [-0.28, 0.28], [-0.3, 0.3], 0.1);
  box(g, 'machined-core', [0, 0.6, 0], [0.72, 0.78, 0.65], M.alu, 0.055);
  for (const x of [-0.36, 0.36])
    box(g, 'end-plate', [x, 0.6, 0], [0.047, 0.72, 0.65], M.bright, 0.018);
  for (const x of [-0.28, 0.28]) for (const z of [-0.24, 0.24]) screw(g, x, 1.008, z);
  for (const x of [-0.38, 0.38])
    for (const y of [0.34, 0.86]) for (const z of [-0.24, 0.24]) screw(g, x, y, z, 'x', 0.028);
  // Fine machining seams across the visible front face.
  for (const x of [-0.28, 0.28]) for (const y of [0.33, 0.87]) screw(g, x, y, 0.34, 'z', 0.028);
  for (let i = 0; i < 14; i++)
    box(g, 'machining-line', [0, 0.28 + i * 0.045, 0.329], [0.6, 0.002, 0.002], M.steel, 0.0005);
  cyl(g, 'bleed-valve', [0, 1.035, 0], 0.055, 0.075, M.dark);
  cyl(g, 'bleed-knob', [0, 1.08, 0], 0.069, 0.025, M.dark, 'y', 12);
  barb(g, [-0.41, 0.68, 0], 'x', -1);
  barb(g, [0.41, 0.68, 0], 'x', 1);
  return g;
}
function pump() {
  const g = new T.Group();
  g.name = 'WaterPumpR385';
  box(g, 'mounting-foot', [0, 0.12, 0], [1.18, 0.1, 0.66], M.rubber);
  for (const x of [-0.48, 0.48]) for (const z of [-0.24, 0.24]) screw(g, x, 0.18, z);
  cyl(g, 'motor-barrel', [0.08, 0.45, 0], 0.27, 0.78, M.dark, 'x', 48);
  for (const x of [-0.24, 0.39]) {
    cyl(g, 'motor-end-cap', [x, 0.45, 0], 0.286, 0.085, M.rubber, 'x', 48);
    ring(g, 'motor-seal', [x, 0.45, 0], 0.274, 0.014, M.steel, 'x');
  }
  for (let i = 0; i < 11; i++)
    ring(g, 'motor-cooling-rib', [-0.17 + i * 0.047, 0.45, 0], 0.274, 0.011, M.rubber, 'x');
  cyl(g, 'diaphragm-head', [-0.48, 0.45, 0], 0.31, 0.29, M.rubber, 'x', 48);
  ring(g, 'head-seal', [-0.63, 0.45, 0], 0.28, 0.02, M.dark, 'x');
  cyl(g, 'head-face', [-0.64, 0.45, 0], 0.25, 0.04, M.dark, 'x');
  cyl(g, 'head-boss', [-0.673, 0.45, 0], 0.11, 0.025, M.rubber, 'x');
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    screw(g, -0.675, 0.45 + Math.sin(a) * 0.23, Math.cos(a) * 0.23, 'x', 0.026);
  }
  for (const x of [-0.48, 0.25]) {
    cyl(g, 'hose-neck', [x, 0.78, 0], 0.075, 0.22, M.rubber);
    for (let i = 0; i < 4; i++)
      ring(g, 'hose-thread', [x, 0.72 + i * 0.04, 0], 0.078, 0.011, M.dark);
  }
  box(g, 'motor-label', [0.1, 0.57, 0.25], [0.38, 0.16, 0.005], M.white, 0.002);
  for (let i = 0; i < 5; i++)
    box(
      g,
      'printed-rating',
      [0.09, 0.53 + i * 0.02, 0.255],
      [0.29 - i * 0.025, 0.004, 0.003],
      M.dark,
      0.001,
    );
  return g;
}
function reactor() {
  const g = new T.Group();
  g.name = 'GlassReactor250ml';
  const glass = new T.MeshPhysicalMaterial({
    name: 'borosilicate-glass',
    color: '#ecfcff',
    metalness: 0,
    roughness: 0.07,
    transmission: 0.96,
    thickness: 0.035,
    ior: 1.47,
    clearcoat: 1,
  });
  const profile = [
    [0, 0.07],
    [0.45, 0.07],
    [0.51, 0.085],
    [0.54, 0.13],
    [0.545, 0.22],
    [0.545, 1.58],
    [0.56, 1.62],
    [0.575, 1.64],
    [0.575, 1.665],
    [0.552, 1.68],
    [0.523, 1.65],
    [0.517, 1.6],
    [0.514, 0.19],
    [0.49, 0.145],
    [0, 0.145],
  ];
  const vessel = new T.Mesh(
    new T.LatheGeometry(
      profile.map((p) => new T.Vector2(...p)),
      96,
    ),
    glass,
  );
  vessel.name = 'thick-walled-glass';
  g.add(vessel);
  ring(g, 'rolled-glass-rim', [0, 1.65, 0], 0.55, 0.022, glass);
  ring(g, 'curved-glass-base', [0, 0.115, 0], 0.515, 0.031, glass);
  box(g, 'vessel-rest', [0, 0.035, 0], [1.15, 0.045, 1.15], M.dark, 0.1);
  // Graduations, with short minor ticks and longer major ticks.
  for (let i = 0; i < 11; i++)
    box(
      g,
      'etched-volume-mark',
      [-0.21, 0.3 + i * 0.105, 0.511],
      [i % 2 ? 0.085 : 0.16, 0.009, 0.004],
      M.white,
      0.001,
    );
  return g;
}
function electronics() {
  const g = new T.Group();
  g.name = 'ESP32DevKitV1';
  box(g, 'board-carrier', [0, 0.09, 0], [0.68, 0.08, 1.25], M.dark, 0.04);
  box(g, 'pcb', [0, 0.15, 0], [0.58, 0.035, 1.13], M.pcb, 0.025);
  for (const x of [-0.25, 0.25]) {
    box(g, 'header-insulator', [x, 0.2, 0], [0.073, 0.075, 1.01], M.rubber, 0.006);
    for (let i = 0; i < 19; i++) {
      box(g, 'gold-header-pin', [x, 0.25, -0.48 + i * 0.053], [0.023, 0.14, 0.023], M.brass, 0.003);
      ring(g, 'solder-pad', [x, 0.172, -0.48 + i * 0.053], 0.024, 0.004, M.brass);
      box(
        g,
        'pin-silkscreen',
        [x + (x < 0 ? 0.07 : -0.07), 0.173, -0.48 + i * 0.053],
        [0.038, 0.003, 0.008],
        M.white,
        0.001,
      );
    }
  }
  box(g, 'esp32-substrate', [0, 0.21, -0.2], [0.39, 0.052, 0.61], M.dark, 0.008);
  box(g, 'rf-shield', [0, 0.26, -0.14], [0.345, 0.08, 0.38], M.steel, 0.015);
  box(g, 'rf-shield-face', [0, 0.304, -0.14], [0.3, 0.008, 0.33], M.alu, 0.009);
  for (let i = 0; i < 5; i++) {
    box(g, 'antenna-trace', [-0.12 + i * 0.06, 0.243, -0.43], [0.014, 0.009, 0.11], M.brass, 0.001);
  }
  for (const z of [-0.48, -0.38])
    box(g, 'antenna-return', [0, 0.243, z], [0.26, 0.009, 0.012], M.brass, 0.001);
  box(g, 'micro-usb-shield', [0, 0.222, 0.54], [0.21, 0.12, 0.19], M.steel, 0.02);
  box(g, 'usb-aperture', [0, 0.219, 0.638], [0.16, 0.062, 0.005], M.rubber, 0.015);
  box(g, 'usb-tongue', [0, 0.208, 0.642], [0.1, 0.013, 0.006], M.dark, 0.003);
  for (const x of [-0.14, 0.14]) {
    box(g, 'boot-reset-switch', [x, 0.2, 0.42], [0.075, 0.05, 0.08], M.steel, 0.004);
    cyl(g, 'switch-button', [x, 0.238, 0.42], 0.022, 0.025, M.rubber);
  }
  box(g, 'usb-uart-ic', [0, 0.2, 0.28], [0.13, 0.045, 0.13], M.rubber, 0.005);
  for (let i = 0; i < 7; i++)
    for (const x of [-0.09, 0.09])
      box(g, 'ic-lead', [x, 0.193, 0.23 + i * 0.015], [0.04, 0.014, 0.007], M.steel, 0.001);
  for (let i = 0; i < 14; i++) {
    const x = ((i % 3) - 1) * 0.12,
      z = 0.08 + Math.floor(i / 3) * 0.042;
    box(g, 'smd-capacitor', [x, 0.19, z], [0.049, 0.03, 0.024], i % 3 ? M.dark : M.brass, 0.003);
  }
  box(g, 'power-led', [0.18, 0.21, 0.32], [0.03, 0.025, 0.04], M.led, 0.002);
  for (const x of [-0.23, 0.23])
    for (const z of [-0.49, 0.48]) {
      cyl(g, 'pcb-spacer', [x, 0.07, z], 0.033, 0.13, M.brass);
    }
  return g;
}
function probe() {
  const g = new T.Group();
  g.name = 'DS18B20Probe';
  cyl(g, 'stainless-probe', [0, 0.78, 0], 0.026, 0.9, M.steel, 'y', 24);
  const cap = new T.Mesh(new T.SphereGeometry(0.026, 16, 12), M.steel);
  cap.position.set(0, 0.33, 0);
  g.add(cap);
  cyl(g, 'probe-crimp', [0, 1.24, 0], 0.036, 0.09, M.dark);
  cyl(g, 'cable-strain-relief', [0, 1.34, 0], 0.027, 0.14, M.rubber);
  return g;
}
function mq135() {
  const g = new T.Group();
  g.name = 'MQ135Sensor';
  cyl(g, 'sensor-stand', [0, 0.55, 0], 0.027, 1.03, M.dark);
  cyl(g, 'stand-foot', [0, 0.045, 0], 0.12, 0.08, M.dark);
  const module = new T.Group();
  module.position.set(0, 1.04, 0);
  module.rotation.x = Math.PI / 2;
  g.add(module);
  box(module, 'sensor-pcb', [0, 0, 0], [0.25, 0.026, 0.45], M.blue, 0.009);
  cyl(module, 'gas-can', [0, 0.12, -0.07], 0.105, 0.18, M.steel);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    box(
      module,
      'mesh-vent',
      [Math.cos(a) * 0.1, 0.12, Math.sin(a) * 0.1 - 0.07],
      [0.008, 0.14, 0.008],
      M.dark,
      0.001,
    );
  }
  for (const r of [0.02, 0.04, 0.06, 0.08])
    ring(module, 'sensor-mesh', [0, 0.213, -0.07], r, 0.004, M.dark);
  box(module, 'trimmer', [0.055, 0.05, 0.13], [0.085, 0.07, 0.09], M.blue, 0.003);
  screw(module, 0.055, 0.09, 0.13, 'y', 0.02);
  for (let i = 0; i < 4; i++)
    box(module, 'sensor-pin', [-0.09 + i * 0.06, -0.04, 0.2], [0.02, 0.14, 0.02], M.brass, 0.002);
  return g;
}
function relay() {
  const g = new T.Group();
  g.name = 'RelayModule';
  box(g, 'relay-pcb', [0, 0.08, 0], [0.57, 0.03, 0.39], M.pcb, 0.01);
  box(g, 'relay-case', [0, 0.22, 0], [0.3, 0.25, 0.3], M.relay, 0.012);
  box(g, 'terminal-strip', [0.22, 0.17, 0], [0.12, 0.15, 0.33], M.pcb, 0.006);
  for (const z of [-0.11, 0, 0.11]) screw(g, 0.22, 0.25, z, 'y', 0.023);
  box(g, 'opto-isolator', [-0.22, 0.13, 0], [0.06, 0.06, 0.11], M.rubber, 0.005);
  return g;
}
function supply() {
  const g = new T.Group();
  g.name = 'DCPowerSupply';
  box(g, 'supply-case', [0, 0.2, 0], [0.95, 0.35, 0.5], M.alu, 0.03);
  for (let i = 0; i < 13; i++)
    box(g, 'vent-slot', [-0.39 + i * 0.065, 0.38, 0], [0.025, 0.005, 0.32], M.dark, 0.003);
  box(g, 'power-terminals', [0, 0.18, 0.28], [0.75, 0.12, 0.12], M.pcb, 0.01);
  for (let i = 0; i < 6; i++) screw(g, -0.3 + i * 0.12, 0.25, 0.28, 'y', 0.022);
  return g;
}
function platform() {
  const g = new T.Group();
  g.name = 'MountingPlatform';
  box(g, 'stainless-worktop', [0, -0.075, 0], [9.4, 0.14, 3.15], M.alu, 0.05);
  box(g, 'front-edge', [0, -0.18, 1.53], [9.35, 0.17, 0.075], M.steel, 0.02);
  box(g, 'rear-edge', [0, -0.18, -1.53], [9.35, 0.17, 0.075], M.steel, 0.02);
  for (const x of [-4.5, 4.5]) box(g, 'side-edge', [x, -0.18, 0], [0.1, 0.2, 3.1], M.dark, 0.01);
  for (const x of [-4.15, 4.15])
    for (const z of [-1.16, 1.16]) cyl(g, 'bench-leg', [x, -0.58, z], 0.07, 0.9, M.steel);
  for (const x of [-4.4, -2.5, 0, 2.5, 4.4])
    for (const z of [-1.35, 1.35]) screw(g, x, 0.01, z, 'y', 0.022);
  return g;
}

// Merge each finish into one mesh to keep equipment detail without one draw
// call per screw, fin or PCB pin. Named assemblies retain independent picking.
function optimize(group) {
  group.updateMatrixWorld(true);
  const batches = new Map();
  group.traverse((obj) => {
    if (obj.isMesh) {
      const transformed = obj.geometry.clone().applyMatrix4(obj.matrixWorld);
      const geometry = transformed.index ? transformed.toNonIndexed() : transformed;
      const key = obj.material.name;
      if (!batches.has(key)) batches.set(key, { material: obj.material, geometries: [] });
      batches.get(key).geometries.push(geometry);
    }
  });
  const result = new T.Group();
  result.name = group.name;
  for (const [name, batch] of batches) {
    const mesh = new T.Mesh(mergeVertices(mergeGeometries(batch.geometries)), batch.material);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    result.add(mesh);
    batch.geometries.forEach((g) => g.dispose());
  }
  return result;
}
const output = new URL('../../frontend/public/models/', import.meta.url);
await mkdir(output, { recursive: true });
for (const [name, assembly] of Object.entries({
  heater: heater(),
  'heat-block': block('AluminiumHeatBlock'),
  'pump-r385': pump(),
  reactor: reactor(),
  esp32: electronics(),
  probe: probe(),
  mq135: mq135(),
  relay: relay(),
  platform: platform(),
  supply: supply(),
})) {
  const asset = optimize(assembly);
  const bytes = await new GLTFExporter().parseAsync(asset, { binary: true });
  await writeFile(new URL(`${name}.glb`, output), Buffer.from(bytes));
  console.log(
    `${name}.glb · ${(bytes.byteLength / 1024).toFixed(0)} KB · ${asset.children.length} material batches`,
  );
}
