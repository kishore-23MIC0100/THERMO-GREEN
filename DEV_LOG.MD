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
