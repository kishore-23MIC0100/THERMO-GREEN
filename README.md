# AlgaeRhythm · THERMO-GREEN

An evidence-first Bio-Compute dashboard: local GLB equipment assemblies, native ESP32 USB telemetry, autonomous firmware safety, a physics-based simulator, actual local compute demonstrations, and reproducible experiment records.

The dashboard follows the supplied design reference in `docs/design/dashboard-reference.png`. Every panel is functional; that image is never used as the application background or as the 3D model. The current prototype uses water, not a demonstrated algae culture. Carbon capture and data-centre savings are not claimed.

## Start in two commands

Requirements: Node.js 22.12+ (22.x) and npm. Chrome or Edge on desktop for physical USB; localhost or HTTPS is required. No Python backend, external model downloads, or hosted account is required to run the dashboard or simulator.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. The application starts **DISCONNECTED** with unavailable device readings. Nothing automatically connects to a USB device or energizes a heater.

## A demonstration that actually runs

1. Click **Simulation**. The amber banner identifies every synthetic sensor stream. A local IndexedDB session starts recording.
2. Open **Compute Demo**. Choose **Attention-model inference** or **Gradient descent training**, then click **Run compute**. A Web Worker performs actual numerical work, reporting completed jobs, processing time, throughput and an output checksum. The inference model uses deterministic synthetic weights, not a pretrained LLM. Training learns a synthetic `y = 2x` regression.
3. Explicitly enable **Link compute workload to heater demand** after fresh, safe telemetry arrives. Requested workload / 100 becomes duty demand in a 30-second period. Hysteresis and relay dwell gate the requests; the ESP32/simulator has final authority. CPU utilization, electrical power and server heat are **not measured** by this mapping.
4. To speed up the thermal demonstration, disconnect first, choose **Settings → Simulation time scale → 30×**, then start a fresh simulation. The watchdog always uses real wall time. Accelerated heating rates are not physical experimental evidence.
5. In **Controls**, inject a thermal trip or pause the heartbeat. Watch the fault latch and reported heater OFF. Restore the sensor/cooldown, resume heartbeat, then explicitly reset. Reset leaves heat OFF.
6. In **Experiments**, rename the session, add objectives/notes, export CSV, compare two runs, and replay the 3D apparatus.

The full script, including physical acceptance tests, is in [docs/demo-script/README.md](docs/demo-script/README.md).

## Digital twin and controls update

The default dashboard now follows the supplied light laboratory reference. The apparatus uses original local GLB assets with detailed heater fins/fan, machined blocks/fittings, ribbed pump, glass reactor, electronics, and mounting hardware. Rebuild them with `npm run models:build`. The expanded twin adds normal/top/front/isometric/focus cameras, exploded view, component visibility, and a labeled conceptual green-fluid option. See [asset production and visual review](docs/design/asset-pipeline.md).

Quick Controls accepts a **requested target from 25 to 50 °C**. It displays the effective operating ceiling separately: requests above **35.0 °C** are capped by the current **35.5 °C** firmware trip. Applying a lower ceiling also stops manual heating above it. Editing the request does not reconfigure firmware safety.

The training demo now plots actual per-epoch mean squared error, reports the matching coefficient and loss, and stops at MSE ≤ 10⁻⁶ or 300 epochs. The requested load controls epoch cadence. Inference remains a separate numerical workload. Neither is a fine-tune of the optional Ollama model.

## Connect real hardware

1. Read [wiring and bring-up](docs/hardware-wiring/README.md) and [safety limits](docs/safety/README.md).
2. Install PlatformIO (VS Code extension or `pip install platformio==6.1.18`). Build with `pio run -d firmware/esp32` and flash with `pio run -d firmware/esp32 -t upload`.
3. `firmware/esp32/include/config.h` deliberately ships with **RELAY_POLARITY_VERIFIED=false**. With heater power disconnected, verify active-LOW/HIGH behavior using a suitable test load. Set `RELAY_ACTIVE_LOW` correctly, then set the verified flag true and reflash only after the bring-up procedure passes. An external pull-up/down must hold the actual relay OFF during MCU reset and before firmware runs.
4. Close Arduino/PlatformIO serial monitors. Click **Connect ESP32**, choose the USB port, and verify fresh sensor data. Baud is 115200.
5. Boot/link faults remain latched until a valid sensor sample, restored heartbeat, safe cooldown and explicit **Reset latched fault**. Observe relay OFF before enabling heat.

CP210x/CH340 boards may require the USB-chip manufacturer's driver and a data-capable cable. Permission denied: retry the chooser from a user click. Port busy: close other serial clients. No data: check baud, power, USB cable and newline JSON. Legacy telemetry is displayed; remote heater enabling requires v2 acknowledgements. The supplied firmware supports both legacy heater commands and v2 commands.

**Hardware testing has not been performed here.** Compilation and mocked transport tests do not certify wiring, relay polarity, DC contact ratings, flow, thermal response or sensor calibration.

## What is included

| Workspace | Behavior |
|---|---|
| Dashboard | Reference-style shell, 3D apparatus, source/freshness status, plots, workload, quick controls and events |
| 3D Digital Twin | Detailed local GLB equipment; orbit/zoom/pan, normal/top/front/detail cameras, exploded view, selection, labels, flow illustration, quality and fullscreen |
| Live Monitoring | Temperature, optional second probe, raw MQ-135 and relay plots; time window, pause, zoom, CSV |
| Controls | Acknowledged requests, timeout handling, E-stop, latched reset, profiles and simulator fault injection |
| Analytics | Stored-sample ΔT, Q, linear-fit rate, weighted duty, max temperature, trip count and time estimate |
| Experiments / Data Logs | IndexedDB sessions, samples, events and notes; rename, export, comparison and replay |
| Chemical Research | Ambient-control protocol and explicitly user-entered precipitate/blank measurements |
| Biological Mode | Separate planned vessel concept and required-measurements checklist; no fabricated growth |
| AI Assistant | Optional tools-free Ollama streaming, exact context/time range, offline state, operator-requested workload burst |
| Hardware / Settings | GPIO, power and fluid guidance; safe bands, units, quality, reduced motion, simulator and local AI options |

## Architecture and provenance

- React + strict TypeScript + Vite; Tailwind v4 tokens and reference-specific CSS; Zustand; Dexie; ECharts; R3F/Three.js.
- `shared/safety.json` is the canonical safety table. `npm run generate` and PlatformIO's pre-build step generate the C++ header. Trip = **35.5 °C**, stale after **2 s**, watchdog after **3 s**, ack timeout **1 s**.
- Serial transport validates every JSON line with Zod, supports split UTF-8 chunks, bounds line buffers and serializes writes. Unknown input never becomes a fabricated reading.
- Simulation emits the same protocol through a worker. Live, simulated and replay are mutually exclusive. Switching sources requests OFF and closes the previous source.
- CSV includes units, source per sample, firmware, trip setting, simulation speed, session and annotation metadata. Potential spreadsheet formulas are escaped.
- Missing samples remain gaps in charts. LTTB downsamples long display series. The active chart window retains at most 7,200 samples in memory; full records stay in IndexedDB.
- Browser visibility suspends heartbeat and requests OFF. Firmware does not depend on the tab or browser to stop heating.
- All fonts, GLB equipment, and geometry are local. No stock images, remote HDRI, telemetry service, API keys or hidden analytics.

Detailed architecture: [docs/architecture/README.md](docs/architecture/README.md).

## Optional local language model

Install [Ollama](https://ollama.com), then pull the base model and build the project-specific local profile from the repository root:

```sh
ollama pull qwen2.5:3b
npm run model:build
OLLAMA_ORIGINS=http://localhost:5173,http://127.0.0.1:5173 ollama serve
```

In **Settings → Ollama model**, choose `thermo-green-analyst:latest`, then use **Check Ollama**. For the macOS app, set `launchctl setenv OLLAMA_ORIGINS "https://thermo-green.vercel.app,http://localhost:5173,http://127.0.0.1:5173"` and restart Ollama. The assistant never receives actuator tools; the operator separately requests any response-length workload burst.

The project profile is instruction/prompt tuned with safety rules and worked examples; it does not fine-tune or update Qwen model weights. See [docs/analysis-model.md](docs/analysis-model.md) and [ollama/Modelfile](ollama/Modelfile) for the full setup and analysis boundaries.

Hosted HTTPS pages may need browser local-network permission and an exact Ollama origin allowlist. Keep Ollama bound to loopback; do not expose its API publicly. Session data sent to the assistant stays on the configured local Ollama service.

## Verify

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit --audit-level=moderate
pio run -d firmware/esp32
```

`npm test` includes frontend/domain tests and native C++ firmware safety tests (`c++` is required). Browser tests use the real simulator worker and a clearly mocked USB transport fixture; none is a physical ESP32 test. GitHub Actions repeats application checks, browser tests and ESP32 compilation.

See [docs/testing.md](docs/testing.md) for the observed verification report and explicit pending tests.

## Production build and hosting

`npm run build` writes static assets to `frontend/dist`. Serve that directory over HTTPS with SPA fallback to `index.html`. `npm run preview -w frontend` previews the built output locally. `vercel.json` and static-host `_headers` / `_redirects` are provided. Check your host actually applies security headers and route fallback. The project is configured for Vercel production deployment. Deployment results are recorded in `docs/deployment.md`.

Browser-local data is per origin and per browser profile. Export records before clearing storage or changing hostnames. This is a single-operator laboratory application, not a multi-user remote-control service. The optional Wi-Fi/FastAPI gateway was intentionally not introduced into the USB safety path.

## Scientific boundaries

Only reactor/optional second-probe temperature, raw gas ADC and firmware-reported relay state can be measured by this baseline. Nominal heater and pump ratings are not actual power or flow measurements. Sensible heat calculations depend on assumed mass/Cp and do not establish carbon removal. Lime water reacts at room temperature; warming is not a trigger and requires an ambient control. The biological module is planned. Warm water alone does not capture carbon.

## Optional VibeWise development plugin

The requested VibeWise Codex plugin is installed in the development environment. See [docs/vibewise.md](docs/vibewise.md) for installation on another machine and `$vibe-wise:learn` usage. It is separate from the shipped dashboard runtime.

The requested `README.D` contains this same guide. `DEV_LOG.MD` records implementation and verification work.
