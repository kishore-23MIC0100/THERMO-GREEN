# Digital twin asset and visual review

The October 2026 light reference is `dashboard-light-reference.png`; the original dark reference is `dashboard-reference.png`. Both are design evidence only and are never loaded into the scene as a substitute for equipment.

## Asset production

The equipment is original modeled geometry exported to local GLB files by `scripts/models/build-assets.mjs`. Blender was not installed in the development environment. The pipeline uses Three.js rounded extrusions, turned profiles, separate material finishes, hose-barb rings, socket heads, mounting parts, fan grille, motor ribs, PCB headers and components, and a lathed thick-wall reactor. This is a detailed scripted modeling pipeline, not imported manufacturer CAD or a claim of photographic accuracy.

Run `npm run models:build` to rebuild the checked-in assets in `frontend/public/models/`. Each finish is merged into a named indexed mesh to reduce draw calls. The same heat-block geometry is loaded once and reused for the two independently selectable blocks. Geometry is cached; per-instance material copies allow heater and LED state to change without mutating another instance. No external geometry, stock photo, remote HDRI, or texture license is required.

The parts, interfaces, and sizes are illustrative product visualization. They are not manufacturing drawings or a wiring certification. `layout.ts` names the equipment positions, exploded offsets, and annotation anchors. Three-dimensional tube endpoints share those positions and fitting offsets. The block #2 assembly connects to an isolated stainless transfer loop in the vessel; the coolant does not mix with reactor water. Bare aluminium should not be used in alkaline lime water.

## Presentation and interaction

The default is a bright laboratory with neutral metal, clear/light-cyan water, physical glass, environment reflections, a mounting bench, and a three-quarter camera. The green reference appearance is an explicitly labeled conceptual option in the expanded twin; it does not claim verified algae culture. Low quality uses simplified transparent glass and reduced DPR. Medium and high retain physical transmission; high adds contact shadows. Animations stop when hidden or reduced motion is selected.

Normal, top, front, isometric, focus, exploded, reset, label/flow toggles, component hiding, fullscreen, and equipment selection remain available. The hardware store supplies reactor temperature and firmware heater state; scene colors and flow tracers are illustrative and do not measure heater-surface temperature or coolant flow.

## Visual comparison

The baseline and final application screenshots are captured at the same 1672-pixel desktop viewport. The review compares equipment placement, visible block separation, heater/pump/PCB details, camera framing, glass, tube continuity, labels, and bright surfaces. The build does not claim pixel identity to the generated reference image. The room background and surface detail remain a real-time approximation; renderer and GPU affect transmission and shadows.

See `visual-review.md` for the resulting screenshots and verified interactions.
