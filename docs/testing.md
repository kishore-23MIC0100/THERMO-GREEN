# Verification report — 26 October 2026

Story: operator selects a source → validated JSON enters shared state → samples/events are stored in IndexedDB → charts and 3D update → explicit commands pass safety gates → acknowledgements or timeouts are visible → records export and replay.

## Observed automated results

| Check | Observed result |
|---|---|
| TypeScript strict check | PASS |
| ESLint | PASS |
| Vitest | 56 tests passed across 10 files |
| Native C++ safety core | PASS: boot OFF, trip latch, cooldown, invalid sensors, watchdog, E-stop, polarity interlock, second probe, stale conversion, bad command, timer rollover |
| Playwright | 6 scenarios passed |
| axe WCAG 2 A/AA dashboard scan | No violations in the tested desktop disconnected state |
| Production build | PASS (Vite 7.3.7) |
| npm audit | 0 vulnerabilities |
| PlatformIO ESP32 build | PASS; 21,960 bytes RAM (6.7%), 290,421 bytes flash (22.2%) |
| VibeWise installation | Installed and enabled, v0.1.44 |

The firmware compiler reports two upstream OneWire preprocessor warnings; the application build may report upstream Zod pure-comment warnings and large 3D/chart chunks. These did not prevent compilation. They are not hidden as successful hardware verification.

## Browser scenarios

1. Disconnected startup, unavailable readings, actual WebGL canvas, top/exploded interactions, keyboard/ARIA/contrast scan.
2. Simulation worker → stored telemetry → acknowledged heater command → thermal trip → rejected hot reset → cooldown/reset → heartbeat trip → CSV export → replay with disabled physical controls.
3. Hidden-tab heartbeat suspension and latched E-stop.
4. Actual local numerical compute jobs and stop, without automatically connecting or energizing hardware.
5. Navigation across implemented routes and mobile layout/navigation with no horizontal page overflow.
6. Mocked Web Serial stream with real reader/writer code: valid and invalid JSON, acknowledged commands, missing-ack timeout with OFF request, stale-data lockout and disconnect cleanup.

Desktop test viewport: 1536×1024. Mobile: 390×844. Additional in-app visual inspection used the supplied design reference. Procedural geometry intentionally preserves actual hardware relationships rather than copying fictitious reference readings or using the screenshot as a background.

## Feature status

| Feature | Status | Scope |
|---|---|---|
| Dashboard, routing, layouts, charts | VERIFIED IN SIMULATION | Browser scenarios and visual review |
| Procedural 3D, selection, cameras, exploded view | VERIFIED IN SIMULATION | Browser render and interaction |
| Thermal model, source labelling, safety injection | VERIFIED IN SIMULATION | Unit and browser tests |
| Heater acknowledgements / timeout / stale lockout | VERIFIED IN SIMULATION | Simulated device and USB fixture |
| Recording, export, replay, comparison storage | VERIFIED IN SIMULATION | Browser export/replay and IndexedDB unit tests; comparison route rendered |
| Local attention inference and regression training | VERIFIED IN SIMULATION | Actual CPU computations with synthetic model/data, unit tests and browser job execution |
| Firmware safety core | VERIFIED IN SIMULATION | Native host tests plus ESP32 compilation; not a physical test |
| Physical ESP32, relay, sensors, flow, power and cutoff | NOT TESTED | Requires actual rig commissioning |
| Real Ollama generation | NOT TESTED | No running local Ollama service was available; connection errors are explicit |
| Chemical/biological outcomes | NOT TESTED | Planned research or manually entered evidence only |
| 60 fps on integrated GPUs / full device matrix | NOT TESTED | Target only; no generalized performance claim |
| Public production deployment | NOT TESTED | Static build and deployment configuration provided; no deployment performed |

No feature is marked VERIFIED ON HARDWARE. A mock serial port is not a physical device, a firmware build is not a successful flash, and a simulator trip does not validate relay wiring. Follow `docs/hardware-wiring/README.md` before energizing the real heater.


## 27 October 2026 update

The earlier table is the original baseline report. The light digital twin rebuild adds local GLB assets and browser coverage for active-stream navigation/focus/visibility, 25–50 °C requested targets with an effective safe ceiling, manual ceiling shutdown, and training-loss convergence. Unit coverage now totals 58 passing tests, and the native firmware safety suite passes. The final browser-run result is recorded in the development log. Build/lint/format checks pass. Actual renderer screenshots and limitations are in [visual review](design/visual-review.md).

Local Ollama inference and Vercel production publishing were verified in later work; the original baseline table's unverified rows describe the initial delivery, not the current release. Physical ESP32 commissioning, calibrated power/flow/gas measurements, and generalized GPU performance remain unverified.
