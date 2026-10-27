# Development log

## 26 October 2026

- Baseline: the original Paveshkamalan/THERMO-GREEN target repository was empty. The final user-selected kishore-23MIC0100/THERMO-GREEN repository had an initial README commit, which is preserved as the parent of this work. User-provided master prompt and later dashboard reference were retained under docs. No existing hardware results were available.
- Established one safety configuration shared by TypeScript and generated C++; implemented boot-safe ESP32 firmware with a deliberate relay-polarity verification interlock, nonblocking temperature conversion, ADC averaging, bounded commands, acknowledgements and independent watchdog.
- Added strict React/Vite application, reference-aligned dashboard shell, live/simulated/replay source separation, Web Serial, protocol validation, command logs and worker-based thermal simulation.
- Created procedural metal/glass apparatus with selectable components, camera controls, exploded view, scene labels, illustrative coolant paths and low/medium/high rendering options. No external model or screenshot substitute is used.
- Added actual attention-model inference and regression-training demonstrations in a worker. Compute timing and job totals are observed; heater coupling remains an explicitly simulated workload mapping guarded by controller/firmware logic.
- Added IndexedDB session/event/note storage, local exports, replay, comparison, thermal analytics, chemical notebook, planned photobioreactor and tools-free local Ollama assistant.
- Added setup/safety guides, runtime and firmware tests, browser scenarios, accessibility checks, static-host security headers and GitHub Actions.
- Corrected initial TypeScript query inference, PlatformIO script context, test doubles, contrast and ARIA findings. Dependency audit reports zero vulnerabilities after selecting compatible patched packages.
- Installed and verified the requested VibeWise Codex plugin v0.1.44. It is development tooling and has no runtime dependency in the dashboard.
- Final safety audit tightened the browser heater gate to require explicit armed=true, a matching advertised trip threshold, below-trip probe readings and active heartbeat. Sixteen regression cases cover missing evidence, faults, dwell, stale data and read-only modes. All 56 unit tests and 6 browser scenarios pass after this change.
- See docs/testing.md for observed results and unverified hardware/service boundaries. GitHub publication status is reported separately after the push attempt.

- Publication target updated to kishore-23MIC0100/THERMO-GREEN at the user's request. Included exact requested DEV_LOG.MD and README.D filenames alongside the standard GitHub README.md. Vercel production deployment requested; credentials remain outside the repository.
- Final visual review reduced 3D component labels to a fixed readable screen size so they no longer obscure the apparatus.

- Published the full project to the requested GitHub repository; application and ESP32 jobs passed in GitHub Actions. Created and linked the Vercel project with the CLI after connector permissions rejected creation. Pinned Node 22 for reproducible production builds. Vercel Git linking was unavailable, so deployment uses committed source uploaded by the CLI.

## 27 October 2026

- Added `thermo-green-analyst:latest`, a reproducible local Ollama profile based on `qwen2.5:3b`, with AlgaeRhythm safety rules, evidence labels, thermal analysis guidance, and worked examples. This is instruction/prompt tuning through an Ollama Modelfile; it does not update Qwen's model weights.
- Updated the assistant to use project-specific evidence boundaries, set the profile as the fresh-install model, and migrate previous default/base-model selections while preserving other saved settings. Added local build, setup, and limitations documentation.
- Built the profile locally and verified real inference for insufficient thermal data, accelerated simulation labeling, and raw MQ-135 limits. `npm run build` passed. Physical hardware behavior and sensor calibration remain unverified.
- Follow-up integration review fixed the request path so the project profile's Modelfile instructions are preserved, sends the slope window and representative sample trend plus recent events/freshness, improves model-missing and network error messages, and configures local Ollama as a loopback-only login LaunchAgent with the production origin allowlisted.


## 27 October 2026 — light digital twin rebuild

- Inspected both supplied dashboard references, existing R3F geometry, USB telemetry path, and compute worker. Retained original dark reference and added the supplied light reference under docs/design.
- Replaced the simple scene assemblies with original local GLB equipment produced by a reproducible Three.js model script. Added machined details, screws, hose barbs, heater fins/fan grille, ribbed pump with bolted head, thick-wall lathed reactor, ESP32 pins/USB/components, sensors, relay, supply, and industrial platform. Blender was unavailable; these are scripted product-visualization assets, not manufacturer CAD.
- Added bright laboratory geometry/environment lighting, revised normal camera, shared named layout/fitting coordinates, connected hot/return tubes, white annotations, selection/focus/visibility, and conceptual green fluid labeling. Kept the real telemetry store and USB protocol.
- Added a 25–50 °C requested-target field with a separately displayed effective ceiling. Preserved the 35.5 °C firmware trip; requests above 35 °C stay capped. Both manual enable and the running heater supervisor now respect a lower applied ceiling.
- Fixed the compute worker's invisible rapid convergence by reporting bounded epochs and actual post-update loss. Added an actual MSE curve and completion threshold. The observed synthetic fit reached MSE 9.807e-7 at 206 epochs with coefficient 1.998295.
- Replaced premature LIVE badges with derived awaiting-telemetry/stale/fault status. The shader scene still uses firmware-reported heater state, reactor sensor readings, and explicit simulation/replay provenance; pump flow remains uninstrumented.
- Captured and reviewed baseline and rebuilt screenshots; fixed a suspense HTML unmount error, annotation overlap, glass depth handling, and light-theme contrast. Verification details and remaining limits are in docs/design/visual-review.md.
- Final verification: 58/58 unit tests, native firmware safety tests, 9/9 browser scenarios, lint, format, and production build passed. Added active-stream navigation/focus/visibility and manual ceiling regression coverage. The navigation fix disables deferred BrowserRouter transitions for this high-frequency telemetry application; the apparatus shares one lazy module across routes. Kept the heater indicator light mounted to avoid lighting-shader recompilation on relay changes.


## 27 October 2026 — reported physical-device USB errors

- Reviewed the supplied hardware photos and Arduino sketch without changing the relay verification lock. The existing native firmware retains RELAY_POLARITY_VERIFIED=false and the 35.5 °C trip.
- Fixed heartbeats being sent before port open, source readiness and write-failure disconnection, idempotent stream cleanup, pending chooser cancellation, old-session callbacks, and acknowledgement acceptance. Explicit reset now requires fresh compatible v2 telemetry and valid cool probes; it preserves the relay lock and leaves heat OFF.
- Preserved device fault bits separately from browser sensor validation, classified recognized startup text as non-telemetry, added fault/recovery explanations, and appended diagnostic provenance to CSV exports. Invalid sensor values and malformed telemetry are still rejected for control.
- Preserved the provided standalone Arduino sketch under firmware/arduino and compiled its esp32dev target successfully: 21,920 bytes RAM, 290,397 bytes flash. No flash or physical relay/sensor verification was performed.
- The targeted USB browser scenarios pass, including delayed open with no premature heartbeat writes, fault=6/armed=false safe reset, current temperature/ADC propagation into the twin, and write-failure transition to DISCONNECTED. The expanded unit suite passes 63 tests and native firmware safety checks.
- Final combined release verification: lint, format check, production build, 63 frontend/domain tests, native firmware safety tests, and all 10 browser scenarios passed. The standalone Arduino esp32dev target compiled successfully; both firmware variants are included in CI. Physical device commissioning remains pending.

## 27 October 2026 — software-renderer follow-up

- The first cloud run of the USB release compiled both firmware variants and passed application static/unit/build checks, but its browser suite exposed excessive rendering cost on the Linux software renderer. Local browser success did not establish cloud success.
- Added separate low-detail GLBs (approximately 580 KB versus 2.7 MB), simpler low-quality materials and lighting, memoized apparatus assets, stable tube curves, and off-screen canvas suspension. Detailed medium/high assets remain available. Heartbeat, watchdog, stale-data, acknowledgement and trip limits are unchanged.
- Made Playwright explicitly use SwiftShader and reran all 10 browser scenarios locally: passed. Cloud verification is recorded with the follow-up commit's GitHub Actions result.

## 27 October 2026 — final heater control and production-policy checks

- The software-renderer follow-up passed both GitHub Actions jobs (run 40461732876) and was promoted. Public-site testing then found a real WebAssembly CSP failure and one cold asset-navigation timeout. Local dev-server testing had not exercised the deployment security policy.
- Allowed WebAssembly compilation specifically, retained the JavaScript eval restriction, emitted fonts as same-origin files, and removed unsupported IPv6 CSP syntax. Browser tests now build and serve the production app with the deployment's actual headers.
- Added a telemetry-driven heater switch with pending feedback and an always-available connected OFF action. Accepted acknowledgements must match the commanded heater/reset state. Rejection, timeout or mismatch requests OFF. OFF cancels pending ON commands and manual actions unlink compute demand, preventing automatic restart.
- Added browser checks for acknowledgement delays, cancellation, rejection, state mismatch, manual ownership beyond dwell, and zero unexpected console errors. Unit coverage is now 64 cases plus native firmware safety tests. Final browser/cloud/public verification is reported with the release result.
- The user confirmed physical relay checks have not been performed. RELAY_POLARITY_VERIFIED remains false in both firmware variants. No hardware was flashed, unlocked or energized by this update.
- Local release checks passed: strict types, lint, formatting, production build, 64 unit tests, native C++ safety tests, and all 12 browser scenarios using the production headers and software renderer.
- GitHub run 40487700324 passed both jobs, including all 12 browser scenarios. Public checks verified all scenarios; one HTTP navigation timeout passed on targeted retry. Real local Ollama inference and its production-origin CORS response were also checked.
- Final visual review identified pale Recent Events text inherited from the dark theme. Corrected the child text/time colors and extended the accessibility scan to an active session with heater ON and populated events.

## 27 October 2026 — records pages and single heater toggle

- Applied the user's follow-up screenshots to Experiments, Hardware Setup and Data Logs. Replaced inherited dark table styling and pale cell text with readable light headers, row separators, hover states and status labels. Added compact event filtering, session counts, a notebook affordance, and explicit UTC sample timestamps.
- Replaced the hardware page's dark text paths with readable visual flow cards and corrected the exchanger/isolated reactor-loop description. Kept firmware pin mapping and physical commissioning requirements.
- Made the fixed header opaque and reset scroll on route changes, so the next page opens with its title and fault information visible beneath the header.
- Removed the separate Stop Heater button as requested. The single telemetry-driven switch can send OFF while ON is pending, including before any ON telemetry arrives. Header E-STOP remains independent. The physical relay verification flag stays false.
- Added coverage for pending-ON cancellation using the single switch and for populated record pages: notebook rename, event filtering, CSV export, contrast scans, route scroll reset, and mobile overflow.
- Final local verification passed: production build, types, lint, formatting, 64 unit tests, native firmware safety checks and all 14 browser scenarios. Populated records pages and the active heater state pass the tested WCAG 2 A/AA scans. Reviewed actual screenshots of all three updated pages.
