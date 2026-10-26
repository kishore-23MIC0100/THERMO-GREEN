# ALGAERHYTHM (BIO-COMPUTE) — MASTER BUILD PROMPT
### For GPT-6 Astra / GPT-6.1 Sol · Full-stack IoT + 3D Digital Twin · Hackathon-ready

---

## 0. HOW YOU MUST WORK (READ FIRST)

You are a senior engineering team: full-stack architect, embedded/IoT engineer, Three.js/R3F specialist, thermal engineer, UI/UX designer, QA engineer.

**Output rules (non-negotiable):**
1. Output **complete, copy-paste-ready files**, each preceded by its exact path. No "...rest of code", no placeholders, no pseudo-code.
2. Work in the **milestones in §12**, in order. After each milestone: list files created, the exact commands to run, and a short "how to verify" checklist. Then stop and say `MILESTONE N COMPLETE — reply "next"`.
3. If you can execute code/tools, run build, lint, typecheck and tests, and report **real** output only. If you cannot run anything, say "NOT RUN" explicitly. Never claim a passing build, test, hardware connection or measurement you did not observe.
4. If a file, library API or version is uncertain, say so and choose the safest documented option. Pin dependency versions in `package.json`.
5. No fake telemetry presented as real. Simulation is allowed only when visibly labelled **SIMULATED**.

**Context:** the demo/competition is TODAY–TOMORROW (SUSTAINATHON 2026, 26–27 Oct). Therefore **Milestones 1–5 must produce a fully working, demo-ready app** (USB + 3D + dashboard + safety + simulator). Everything after is bonus.

---

## 1. PROJECT TRUTH (SOURCE OF TRUTH — DO NOT EMBELLISH)

**One-line:** Simulated AI-workload heat → ESP32-controlled heater → closed water loop → heat exchanger in a reactor beaker → temperature sensing → autonomous hardware safety.

**Hardware (documented, real):**
- ESP32 DevKit V1 (USB serial, 115200 baud)
- 40 W ceramic PTC heater plate, 12 V / 3.3 A = Thermal Test Vehicle (stand-in for an AI chip; NOT a real server)
- Aluminium Block #1 (cold plate on heater, thermal paste) and Block #2 (heat exchanger in reactor)
- R385 12 V diaphragm pump, ~1.2 L/min, ~80 mL distilled water, 6 mm ID / 8 mm OD silicone tube. Pump is wired directly to 12 V — **the ESP32 cannot switch it.**
- 250 mL borosilicate beaker (reactor)
- DS18B20 (GPIO 4, 4.7 kΩ pull-up to 3.3 V), MQ-135 analog (GPIO 34 via 5 V→3.3 V resistor divider), 5 V opto-isolated relay (GPIO 23, **verify active-HIGH vs active-LOW before wiring**)
- Power: 12 V 5 A for pump + heater; USB for ESP32 logic.

**Control philosophy:** *"The laptop decides, the ESP32 has autonomous authority."*

**ESP32 firmware failsafes (force relay OFF unconditionally):**
1. `temp >= TRIP_C` (default **35.5 °C**) → thermal trip, latched until cool-down + explicit reset
2. Sensor fault: disconnected (-127.0 °C), power-on-reset value (85.0 °C), NaN → fault
3. Heartbeat lost > 3 s → heater OFF
4. Emergency-stop command → heater OFF
5. Boot state = heater OFF

> **Reconciliation note:** the pitch deck says 36 °C; the README (latest baseline) says 35.5 °C. Use **35.5 °C** as the single constant `TRIP_C` in firmware and UI, and expose it in one config file. Do not hard-code it in multiple places.

**Science (use exactly):**
- Q = m·Cp·ΔT; ≈330 g water (80 g loop + 250 g beaker) → ≈1,380 J/°C; 40 W → ≤1.7 °C/min ideal; 24→35.5 °C ≈ 6.5 min ideal (longer in reality: block thermal mass, losses).
- Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O proceeds at room temperature; heat is not a trigger. Warming raises kinetics but lowers CO₂ and Ca(OH)₂ solubility → must be baselined against a room-temperature control.
- Air is ~420 ppm CO₂; 1 L/min supplies ≈0.8 mg CO₂/min; 250 mL saturated lime water absorbs ≤ ≈0.25 g CO₂. Capture is supply/mass-transfer limited.
- Spirulina optimum ≈30–35 °C (approximate), damage above ≈38–40 °C. Planned module only.

**Claims classification (every metric in the UI carries one badge):**
`MEASURED` · `CALCULATED` · `ESTIMATED` · `SIMULATED` · `PROJECTED` · `UNAVAILABLE` · `NOT CLAIMED`

**Never claim or display:** live CO₂ mass captured, ">300% faster when warm", calibrated CO₂ ppm from MQ-135, algae growth, measured flow (no flow sensor), measured power draw, real data-centre savings, or any result not produced by real hardware.

**Known hazards to surface in the UI/docs:**
- Bare aluminium + lime water (pH > 12) corrodes and releases H₂ → use stainless/copper/coated Block #2 or distilled water for demo.
- Pump failure leaves Block #1 unprotected if only the beaker is sensed → recommend 2nd DS18B20 on Block #1 (support it in protocol as optional `temp2`).
- Keep fluids physically below/away from the breadboard and 12 V rails.
- Relay contacts must be DC-rated for 12 V / 3.3 A+; fuse the heater rail.

---

## 2. WHAT TO BUILD

A **web-based AlgaeRhythm Digital Twin**: a premium industrial/scientific app with a large interactive 3D apparatus driven by **real ESP32 telemetry over Web Serial** (no Python bridge), plus analytics, experiment logging, an optional local-AI assistant, and a planned Spirulina module.

**Three runtime modes, always visible in a top-bar chip:**
| Mode | Source | Chip colour |
|---|---|---|
| LIVE | Web Serial from real ESP32 | Emerald |
| SIMULATED | Built-in thermal-model simulator (§8) | Amber |
| REPLAY | Recorded session | Cyan |

Disconnected → show **DISCONNECTED** and "Unavailable" for every value. Never default to fake numbers.

---

## 3. TECH STACK (PIN VERSIONS; PREFER BOTH-WORKS-TODAY OVER BLEEDING EDGE)

**Frontend:** React 18/19 + TypeScript (strict) + Vite · Tailwind CSS · `motion` (Framer Motion) · Zustand (+ persist) · Apache ECharts (`echarts-for-react`) · React Router · Zod (runtime validation) · Dexie (IndexedDB for session storage) · Lucide icons.
**3D:** `three` + `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing` (subtle bloom/SSAO only, toggleable) + `leva` (dev-only debug).
**Web Serial:** native `navigator.serial` + TransformStream line-splitter + `@types/w3c-web-serial`.
**Firmware:** Arduino C++ via PlatformIO · `OneWire` · `DallasTemperature` · `ArduinoJson`.
**Optional backend (Milestone 8 only):** FastAPI · Pydantic v2 · WebSockets · SQLite (default) / PostgreSQL · pytest.
**Optional AI:** Ollama at `http://localhost:11434` called directly from the browser (needs `OLLAMA_ORIGINS` set) — **no Python required**. Model name configurable (default a small Gemma/Llama-class model).
**Quality:** Vitest + React Testing Library + Playwright · ESLint + Prettier · GitHub Actions CI.

**3D asset policy:** do **not** depend on Blender or external GLB files. Build the entire apparatus as **procedural R3F geometry** (parametric components in code), so the project runs immediately. Structure components so a GLB can replace any part later (`<ComponentSlot glb?>`). Use physically based materials (`MeshPhysicalMaterial`: transmission for glass/water, clearcoat for silicone tubes, roughness/metalness for aluminium), an HDRI-free lighting rig (key + rim + hemisphere) to avoid external downloads, and instancing for repeated fins/bubbles.

---

## 4. TELEMETRY PROTOCOL

**Legacy line (must remain supported, newline-delimited JSON at 115200):**
```json
{"temp":34.2,"gas":1830,"heater":1,"fault":0}
```
- `temp` °C (reactor DS18B20) · `gas` raw ADC 0–4095 (relative only) · `heater` 0/1 (relay commanded state) · `fault` bitmask.

**Fault bitmask (define in firmware + frontend from one shared table):**
`1 = THERMAL_TRIP` · `2 = SENSOR_FAULT` · `4 = LINK_TIMEOUT` · `8 = E_STOP` · `16 = BAD_COMMAND`

**Optional v2 extension (additive, backward compatible):**
```json
{"v":2,"seq":1042,"uptime_ms":88213,"temp":34.2,"temp2":null,"gas":1830,"heater":1,"fault":0,"trip_c":35.5,"ack":17}
```
**Commands (laptop → ESP32), one JSON line each:**
```json
{"cmd":"heater","value":1,"id":17}
{"cmd":"heartbeat"}
{"cmd":"estop"}
{"cmd":"reset_fault"}
```
Legacy `{"heater":1}` must also work. The ESP32 replies with `ack` = command id. UI shows a command as "pending" until acknowledged; show a timeout if no ack in 1 s.

Validate every incoming line with Zod. Handle: malformed JSON, partial lines, out-of-range values, -127/85 °C sentinels, stale data (> 2 s → "STALE"), disconnect/reconnect, multiple rapid commands.

**Heartbeat:** frontend sends a heartbeat every 1 s while connected; firmware trips LINK_TIMEOUT at > 3 s. When the tab hides or the app crashes, the heater must therefore go off by itself — add a test for this.

---

## 5. CONTROL LOGIC

- **Hysteresis controller (frontend):** setpoint band default 32–35 °C (configurable but clamped below `TRIP_C − 0.5`). Heater ON when `temp < low`, OFF when `temp > high`. Minimum on/off dwell time (default 5 s) to protect the relay.
- **Workload profiles (the "AI load"):** `IDLE`, `INFERENCE` (short periodic bursts), `TRAINING` (sustained), `CUSTOM`. A profile sets a *demand duty*, the hysteresis controller gates it, the ESP32 has final say.
- **AI-prompt demo ("Ask the AI a question"):** the user types a prompt → optional local LLM generates a response → the app maps the **response length / generation time** to a workload burst (a transparent, deterministic mapping shown on screen). The LLM never sends heater commands directly; it only influences the *requested workload*, which passes through the controller and ESP32 safety. Label this "LLM-triggered workload simulation".
- **Manual controls:** Heater ON/OFF (disabled while faulted), Emergency Stop (big, always visible, red), Reset Fault (enabled only when temp < `TRIP_C − 2` and fault cleared).
- Pump: show as "Always powered (not software-controlled)" — **no pump toggle**.

---

## 6. UI / UX SPECIFICATION

**Feel:** professional scientific/industrial software (think mission-control meets lab instrument), not a generic SaaS template. Dark-first. Dense but calm. No gratuitous glow, no floating-card soup, no stock gradients.

**Design tokens** (put in `tailwind.config` + CSS variables):
| Token | Hex |
|---|---|
| bg-base | `#0B1726` |
| bg-surface | `#101F33` |
| bg-raised | `#243447` |
| deep-teal | `#124E55` |
| emerald | `#20B486` |
| cyan (coolant) | `#39C8D0` |
| mint | `#D9F5EB` |
| text-primary | `#F8FAFC` |
| text-muted | `#64748B` |
| amber (heat/warn) | `#E7A64B` |
| fault-red | `#DC5B63` |

Typography: Montserrat (headings), Inter (body), JetBrains Mono (numbers/telemetry), loaded with `font-display: swap` and local fallbacks. Tabular numerals for all live values.

**Layout (desktop-first, ≥1280 px):** left slim nav rail → centre **3D viewport (≈60% width)** → right instrument column (live gauges, status, controls) → bottom collapsible time-series strip. Tablet: instrument column becomes a drawer. Mobile: viewport on top, tabbed panels below, E-Stop pinned.

**Routes / screens:**
1. `/` Landing — hero with the live-rendered 3D rig (auto-rotating, lightweight), value proposition, how-it-works (4-step flow), honest capability matrix (Demonstrated / Calculated / Projected), CTA "Open Control Center".
2. `/twin` Digital Twin workspace — main app.
3. `/monitor` Sensor monitoring — large charts: temperature, heater state band, gas trend (relative).
4. `/control` Hardware control + safety status + command log with acks.
5. `/thermal` Thermal analytics — ΔT, Q = m·Cp·ΔT (CALCULATED, editable mass/Cp inputs), measured heating rate vs ideal 1.7 °C/min, heater duty cycle %, time-to-setpoint.
6. `/chemistry` Chemical Research mode — experiment protocol for lime water with **room-temperature control vs heated** run comparison; no capture result shown unless the user enters measured data (e.g., precipitate mass) manually (label MEASURED-USER-ENTERED).
7. `/algae` Spirulina photobioreactor — planned module (§9), permanent "PLANNED — NOT DEMONSTRATED" banner.
8. `/experiments` Session list, create/rename/annotate, compare two sessions overlaid, CSV export, replay in 3D.
9. `/assistant` AI research assistant (optional, §10).
10. `/settings` Device settings: baud, trip display, setpoint band, units, Ollama URL/model, simulation toggle, theme-safe reduced-motion.

**UX requirements:**
- Global **status bar**: mode chip, connection, data freshness (age in s), trip limit, fault banner (red, persistent until cleared).
- Every number is a `<MetricCard>` with value, unit, classification badge, and "as of" age. Tooltip explains the source/formula.
- Empty/error/loading states designed for every screen (disconnected, unsupported browser, permission denied, port busy).
- **Browser support gate:** detect `navigator.serial`; if missing, explain "Use Chrome or Edge on desktop over `localhost` or HTTPS" and offer Simulated mode.
- Keyboard accessible, visible focus rings, WCAG AA contrast, `prefers-reduced-motion` respected, ARIA live region for fault announcements, colour never the only signal.
- Micro-interactions only where state changes (heater on, fault, ack received).
- Toasts for connect/disconnect/fault; confirm dialogs for E-Stop reset.
- First-run guided tour (4 steps, skippable).

---

## 7. 3D DIGITAL TWIN SPECIFICATION

Scene units: 1 unit = 10 cm. Keep proportions believable (beaker Ø≈7 cm × 9.5 cm; blocks ≈ 4×4×2 cm; PTC plate ≈ 6×6×0.5 cm; pump ≈ R385 body; tubing 8 mm OD).

**Components (each is its own named, selectable component with metadata):**
1. AI heat-source module (stylised "server tray" housing the PTC plate; labelled "Thermal Test Vehicle")
2. PTC heater plate
3. Aluminium Block #1 (cold plate)
4. R385 pump
5. Silicone tubing (CatmullRom/TubeGeometry paths routed pump → Block #1 → Block #2 → pump)
6. Aluminium Block #2 (heat exchanger, submerged)
7. Reactor beaker (transmissive glass + water volume with a fill-level mesh)
8. DS18B20 probe (in water)
9. MQ-135 module (above beaker)
10. ESP32 DevKit board (with pin labels)
11. 5 V relay module + 12 V supply + wiring harness (thin cable meshes, colour-coded)

**Interactions:** orbit/zoom/pan (damped), click-select with outline + info drawer (spec, role, signals, hazards), hover labels, **exploded view** (animated offsets), **flow-direction toggle**, **sensor-location overlay**, **thermal overlay** (see rules), camera presets (Overview / Fluid loop / Electronics / Reactor), fullscreen.

**Data → visual rules (every animation needs a data source and a label):**
| Visual | Driven by | Rule |
|---|---|---|
| Heater plate amber emissive | `heater` field | Restrained emissive + "REPORTED ON @ time" tag. No exact plate temperature shown. |
| Reactor water colour tint | measured `temp` | Cool→warm colour ramp mapped 20–36 °C; legend visible; hidden when disconnected (neutral grey). |
| Coolant flow particles | none (no flow sensor) | Always tagged **"Illustrative flow"**; hidden/paused when disconnected. |
| Fault | `fault` bitmask | Heater glow off, red pulse on the offending part (sensor / relay / link icon), fault card with reason + timestamp, entry added to event log. |
| MQ-135 | `gas` | Small relative-trend sparkline on the part; text "Relative reading — not CO₂ ppm". |
| Replay | recorded session | Whole scene gets cyan "REPLAY" frame + scrubber. |
| Simulation | simulator | Whole scene gets amber "SIMULATED" frame. |

**Performance budget:** 60 fps on integrated GPU laptops; < 150 draw calls; DPR cap 1.75; `frameloop="demand"` when idle; `Suspense` + loading skeleton; dispose geometries/materials on unmount; quality toggle (Low/Med/High) that disables postprocessing and transmission on Low. Pause render when tab is hidden.

---

## 8. SIMULATOR (FOR TESTING & NO-HARDWARE DEMO)

Implement a lumped-capacitance thermal model in a Web Worker:
`C·dT/dt = P_heater·η − h·A·(T − T_amb)` with `C ≈ 1380 J/°C + block thermal mass (configurable)`, `P = 40 W when relay ON`, ambient default 28 °C (Tamil Nadu room), configurable losses. Emit the same JSON lines as the real ESP32 through the same parser, including simulated trip/fault/timeout behaviour. Everything it produces is badged `SIMULATED`. It must be impossible to confuse with LIVE data (separate mode chip + frame + CSV column `source=simulated`).

---

## 9. SPIRULINA PHOTOBIOREACTOR MODULE (PLANNED)

Separate route + separate 3D scene: transparent cylindrical/flat-panel vessel, culture medium, LED panel, CO₂ inlet, air diffuser with instanced bubbles, gas outlet, isolated heat-exchange coil, pH probe port, DS18B20 port, sampling port. Static explanatory visuals only; **no growth animation tied to fake data**. Include a "required measurements" checklist (OD680/dry-weight biomass, pH, temperature, light intensity, inlet/outlet CO₂, carbon mass balance) and a temperature-window bar (optimal ≈30–35 °C, caution, damage ≈38–40 °C) with the trip marker. Statement shown permanently: *"Warm water alone does not capture carbon."*

---

## 10. AI ASSISTANT (OPTIONAL, ADVISORY ONLY)

Chat panel using local Ollama (streaming). System prompt must force: cite the exact data/time range used, label claims with the classification set, say "insufficient data" when appropriate, refuse to claim CO₂ capture, and never issue hardware commands. Provide tools-free helpers: "Summarise this session", "Explain this fault", "Why is heating slower than 1.7 °C/min?" (feeds computed stats as context). If Ollama is unreachable, show a clear offline state — don't mock responses. ML (anomaly detection, forecasting) is **out of scope until ≥ 20 real sessions exist**; implement only the data-export pipeline.

---

## 11. DATA & EXPERIMENTS

- Store sessions locally in IndexedDB (Dexie): `sessions`, `samples` (timestamp, temp, gas, heater, fault, source, seq), `events` (faults, commands, acks), `notes`.
- Compute derived metrics from stored samples only: heating rate (linear fit on a sliding window), time-to-setpoint, duty cycle, max temp, trip count, Q = m·Cp·ΔT.
- CSV export with units in headers and a metadata block (firmware version, trip, mode, notes).
- Session compare: overlay two runs with time-aligned x-axis (needed for the room-temp vs heated lime-water protocol).
- Downsample charts with LTTB for long sessions.

---

## 12. MILESTONES (EXECUTE IN ORDER)

**M0 — Baseline report.** Read the repo/files provided (README, deck PDF/PPTX). List what is actually implemented vs only specified, list contradictions (e.g., 36 vs 35.5 °C; deck's Python/Ollama backend vs README's Web Serial design) and your resolutions. No code.

**M1 — Firmware (`firmware/esp32/`).** Complete PlatformIO project: setup, 500 ms sensor loop, non-blocking DS18B20 read, relay polarity constant, fault bitmask, latched trip with cool-down reset, heartbeat watchdog (3 s), legacy + v2 JSON, command ack, E-stop, boot-safe state, MQ-135 ADC read with averaging. Include `docs/hardware-wiring/` table + Mermaid wiring/fluid diagram and a bring-up/test procedure (relay polarity test with a lamp *before* the heater).

**M2 — Frontend foundation.** Vite+TS strict, Tailwind tokens, routing, layout shell, status bar, MetricCard + badge system, settings store, browser-support gate, lint/format/test setup.

**M3 — Web Serial + protocol + simulator.** Serial service (connect, read loop, line splitter, reconnect, close-on-unload), Zod parsers, command queue with acks/timeouts, heartbeat, stale detection, simulator worker, unit tests for parser/controller/simulator.

**M4 — 3D digital twin.** Full procedural apparatus, selection, exploded view, overlays, data bindings per §7, performance toggles.

**M5 — Dashboard + control + safety UX (DEMO-READY CUT).** Monitor, control, fault flows, E-Stop, hysteresis + workload profiles, LLM-triggered workload demo, thermal analytics page, landing page. Run full demo script: connect → INFERENCE burst → temp climbs → TRAINING → trip at 35.5 °C while UI still requests heat → unplug USB/stop heartbeat → heater OFF.

**M6 — Experiments & analytics.** Sessions, recording, replay in 3D, compare, CSV, chemistry protocol page.

**M7 — Spirulina module + AI assistant.**

**M8 — (Optional) Wi-Fi/FastAPI gateway.** ESP32 WebSocket client, token auth, FastAPI relay + SQLite/Postgres persistence, reconnect/latency display, tests. Firmware safety must remain independent of network.

**M9 — Hardening & delivery.** Playwright E2E (simulator-driven), accessibility pass, responsive pass, 3D perf pass, security notes (no secrets committed, CORS/CSP, command validation), README (setup, supported browsers, drivers CP210x/CH340, port troubleshooting, flashing), DEV_LOG, and a **final status table** with each feature marked `VERIFIED ON HARDWARE` / `VERIFIED IN SIMULATION` / `NOT TESTED`.

---

## 13. REPO STRUCTURE (ADAPT, DON'T CREATE EMPTY FOLDERS)

```
algaerhythm/
├─ frontend/src/{app,pages,components,digital-twin/{scene,parts,overlays,materials},
│               hardware/{serial,protocol,simulator,controller},analytics,db,stores,hooks,lib,types,styles}
├─ firmware/esp32/{platformio.ini,src/main.cpp,include/config.h,test/}
├─ backend/               # only if M8 is built
├─ docs/{architecture,hardware-wiring,safety,experiment-protocols,demo-script}
├─ README.md  DEV_LOG.md  .github/workflows/ci.yml
```

---

## 14. ACCEPTANCE CRITERIA (DEMO-DAY MINIMUM)

1. `npm install && npm run dev` opens the app; `npm run build`, `npm run typecheck`, `npm test` pass (report real output).
2. In Chrome/Edge, "Connect Device" lists the ESP32 and live telemetry updates the gauges and the 3D scene within 1 s.
3. Without hardware, Simulated mode runs the identical pipeline and is unmistakably labelled.
4. Autonomous trip at 35.5 °C and heartbeat-loss shutdown both visible in the UI and recorded in the event log.
5. No screen shows CO₂ captured, flow rate, power draw or algae growth as measured values.
6. Claims matrix on the landing page matches §1 exactly.
7. Session can be recorded, exported to CSV and replayed.

---

## 15. FINAL INSTRUCTION

Start with **M0 (baseline report)**, then immediately continue to **M1**. Be honest about anything unverified, and prefer a smaller thing that truly works over a larger thing that only looks finished.
