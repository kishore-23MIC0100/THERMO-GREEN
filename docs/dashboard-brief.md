# ALGAERHYTHM (BIO-COMPUTE)
## ULTIMATE MASTER BUILD PROMPT — GPT-6 ASTRA / GPT-6.1 SOL
### Production-Quality 3D Digital Twin Dashboard + Real-Time ESP32 Hardware Integration

---

# 1. YOUR ROLE

Act as an elite software and engineering team combining the expertise of:

- Principal Full-Stack Architect
- Senior React and TypeScript Engineer
- Three.js and React Three Fiber Specialist
- Industrial Digital Twin Engineer
- Advanced UI/UX Designer
- 3D Technical Artist
- Embedded ESP32/IoT Engineer
- Real-Time Communication Engineer
- Scientific Data Visualization Engineer
- Thermal Engineering Specialist
- Environmental Research Software Engineer
- Cybersecurity Engineer
- Quality Assurance and Performance Engineer

Your objective is to build the complete **AlgaeRhythm Bio-Compute Digital Twin Dashboard**, closely matching the uploaded dashboard screenshot.

The application must resemble a professionally engineered industrial control center used in a sustainability research laboratory.

The final output must be:

- Visually premium
- Fully functional
- Responsive
- Hardware-connected
- Scientifically accurate
- Highly interactive
- Real-time capable
- Reliable
- Maintainable
- Production-oriented

Do not create a generic dashboard, landing-page template, static mockup, or disconnected 3D animation.

**BUILD THE ACTUAL APPLICATION.**

---

# 2. PRIMARY VISUAL REFERENCE

The user has provided an image showing the required AlgaeRhythm dashboard.

Treat this uploaded image as the authoritative **visual-design reference**, not as evidence of live hardware measurements or existing functionality.

Recreate its overall appearance, component placement, spacing, visual hierarchy, typography, and industrial styling.

The dashboard reference contains:

### Top Navigation Bar

- AlgaeRhythm logo and branding
- Bio-Compute subtitle
- "AI Waste Heat → Carbon Capture" label
- ESP32 connection status
- Device communication indicator
- Uptime display
- SUSTAINATHON 2026 identification

### Left Navigation Sidebar

- Dashboard
- 3D Digital Twin
- Live Monitoring
- Controls
- Analytics
- Experiments
- Reactor Modes
- AI Assistant
- Hardware Setup
- Data Logs
- Settings

At the bottom:

- Live Hardware / Simulation mode selector
- Application branding and version

### Main Workspace

Large, realistic, interactive 3D model of the physical AlgaeRhythm system.

### Right Monitoring Panel

- ESP32 connection
- Reactor temperature
- Heater status
- Pump status
- Gas sensor status
- Telemetry freshness

### Middle Analytics Row

- Simulated AI Workload
- Live Temperature Chart
- Gas Sensor Trend

### Bottom Control Row

- Reactor Mode Selection
- Quick Controls
- Recent Events

**The screenshot is the visual specification, but not a static background to reproduce.**

All dashboard elements must be implemented as independent, interactive components.

---

# 3. EXACT DESIGN SYSTEM

## Colour Palette

Use the following theme throughout the entire application:

| Design Token | HEX | Usage |
|---|---|---|
| Main Background | #06111D | Global background |
| Sidebar Background | #071522 | Navigation |
| Main Surface | #0A1B2B | Large panels |
| Elevated Surface | #102338 | Cards and controls |
| Panel Border | #19384B | Dividers and borders |
| Emerald Accent | #00E5A0 | Active states and primary accent |
| Aqua Cyan | #22D3EE | Cooling and monitoring |
| Thermal Orange | #FF8A3D | Heater and hot coolant |
| Alert Red | #FF5C63 | Faults and emergency control |
| Sensor Purple | #A66BFF | Gas trend visualization |
| Main Text | #F4F8FB | Primary typography |
| Secondary Text | #9AB0C3 | Descriptions |
| Muted Text | #61788E | Timestamps and hints |

Use emerald green for healthy, active, or verified positive states.

Use orange for thermal events.

Use cyan for coolant, data, and sensing.

Use purple only where it helps distinguish the gas sensor series.

Reserve red for actual faults, rejected operations, and emergency actions.

Never make colours the only way to identify status.

## Typography

Use:

- Inter for primary UI text
- Space Grotesk for headings and key numbers
- JetBrains Mono for telemetry, device IDs, timestamps, and technical values

Recommended desktop sizes:

- Page headings: 24–30 px
- Section headings: 18–22 px
- Primary numerical readings: 26–34 px
- UI labels: 13–15 px
- Regular body text: 14–16 px
- Supporting captions: 12–14 px, with sufficient contrast

Maintain strong readability at common laptop resolutions.

## Styling Requirements

- Dark industrial theme
- Refined rounded panels
- Thin, subtle borders
- Restrained neon accents
- Carefully controlled glass effects
- Soft layered shadows
- High-contrast data visualization
- Premium spacing and alignment
- Clean iconography
- Balanced whitespace
- No unnecessary visual clutter

Avoid exaggerated glassmorphism, excessive glowing buttons, random floating particles, oversized gradients, and generic AI-generated SaaS design patterns.

The interface should feel engineered, not decorated.

---

# 4. COMPLETE TECH STACK

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- TanStack Query where appropriate
- React Router
- Motion for React
- Lucide React

## 3D Digital Twin

- Three.js
- React Three Fiber
- React Three Drei
- Blender for custom 3D assets
- GLB/glTF models
- PBR materials
- Efficient geometry and textures

## Data Visualization

- Apache ECharts
- Custom telemetry widgets
- Timestamp-based live data streams
- Historical playback charts

## Hardware Communication — Primary

- Browser Web Serial API
- USB connection to ESP32
- 115200 baud
- JSON serial protocol

This is the primary communication method supported by the latest AlgaeRhythm project description.

**Do not require Python, FastAPI, MQTT, or an external server just to establish basic ESP32 USB communication.**

## Optional Advanced Backend

Only introduce when required for persistent telemetry, authenticated remote access, AI assistance, or multiple devices:

- Python
- FastAPI
- WebSockets
- PostgreSQL
- SQLAlchemy
- MQTT where justified

## ESP32 Firmware

- Arduino C/C++
- PlatformIO or Arduino IDE
- OneWire
- DallasTemperature
- JSON serialization
- GPIO control
- Relay switching
- Autonomous safety logic

## Testing

- Vitest
- React Testing Library
- Playwright
- Pytest if a Python backend exists
- Firmware unit tests where possible

Use currently compatible stable library versions after verifying them.

---

# 5. MAIN DASHBOARD LAYOUT

Build the initial desktop interface using a three-region application shell:

**Region A — Left Sidebar**

Fixed or collapsible navigation.

**Region B — Main Workspace**

Large interactive 3D digital twin plus analytics and experiment controls.

**Region C — Right Status Panel**

Device status and important sensor readings.

The main 3D view must receive the largest visual area.

Use a flexible CSS Grid layout rather than hard-coded coordinates tied to a single screen resolution.

The reference screenshot is approximately a wide desktop control-center layout.

Support:

- 1920 × 1080
- 1600 × 900
- 1440 × 900
- 1366 × 768
- Tablets
- Mobile devices

On smaller screens, reorganize panels and collapse navigation without hiding critical status or safety controls.

Avoid horizontal overflow and clipped 3D canvases.

---

# 6. TOP HEADER

Recreate the screenshot's top header.

Left:

AlgaeRhythm logo

**AlgaeRhythm**

Bio-Compute

Center:

**AI Waste Heat → Carbon Capture**

Right:

- ESP32 connection indicator
- Connection type
- Connection duration
- Hackathon identity

Device states must be genuine:

- Connected
- Connecting
- Disconnected
- Reconnecting
- Fault
- Stale Telemetry
- Simulation

Do not display "Connected" on initial page load unless a real device connection has been established.

If device uptime is unavailable, display the application connection duration and label it accordingly.

---

# 7. LEFT SIDEBAR NAVIGATION

Implement all sidebar entries as functional routes.

## Dashboard

Complete system overview.

## 3D Digital Twin

Expanded interactive apparatus view with component inspection.

## Live Monitoring

Full-screen telemetry charts, sensor readouts, and device status.

## Controls

Authorized commands, safety state, and actuator configuration.

## Analytics

Experiment analysis, thermal calculations, and comparisons.

## Experiments

Session recording, tagging, history, export, and replay.

## Reactor Modes

Thermal prototype, proposed chemical research mode, and proposed biological research mode.

## AI Assistant

Optional local AI explanation tool.

## Hardware Setup

Connection instructions, serial selection, GPIO diagrams, and troubleshooting.

## Data Logs

Telemetry and event logs with filters and export.

## Settings

Dashboard preferences, data retention, and device configuration.

All routes must render useful implemented interfaces, even if advanced functionality is explicitly marked as not yet available.

Do not create dead navigation links.

---

# 8. MAIN 3D DIGITAL TWIN — HIGHEST PRIORITY

This is the most important element in the entire application.

Recreate the 3D apparatus shown in the screenshot as closely as practical while preserving the actual project hardware layout.

**Do not place the uploaded screenshot inside the 3D area as a substitute for a model.**

Develop real 3D geometry and reusable scene components.

## Required 3D Components

### 1. Heat Source

A realistic industrial-looking 40 W PTC heater.

Appearance:

- Metallic enclosure
- Amber temperature highlights
- Visible cable connection
- Attached heat-transfer surface
- Label: "40 W PTC Heater — Simulated AI Heat"

When the relay reports ON, activate a restrained orange visual indicator.

When OFF, deactivate it.

The visual indicator represents reported heater output, not a measured heater-surface temperature.

### 2. Aluminium Cooling Block #1

Model the first metallic cooling block.

Include:

- Aluminium material
- Coolant inlet
- Coolant outlet
- Thermal contact with heater
- Technical label
- Selectable inspection overlay

### 3. R385 Water Pump

Create a realistic compact black pump.

Include:

- Inlet connection
- Outlet connection
- Motor housing
- Electrical lead
- Identification label

The pump in the documented baseline is powered directly by the 12 V rail.

Do not claim software-controlled pump ON/OFF or verified rotation without additional instrumentation.

### 4. Cooling Tubes

Create curved, transparent silicone tubes connecting:

Pump → Block #1 → Block #2 → Pump

Provide a clean, physically continuous closed loop.

Use subtle blue/cyan flow-path visualization.

Do not incorrectly reverse the coolant path.

Use orange/red highlights only where they represent an illustrative thermal gradient or verified temperature measurements.

### 5. Aluminium Cooling Block #2

Create the reactor-side heat exchanger.

Place the heat-transfer block inside or thermally coupled to the vessel according to the selected design.

Clearly show that coolant remains inside the closed circuit.

The coolant must not mix with the chemical or biological reactor medium.

The 3D design must account for chemical compatibility, especially when calcium hydroxide is used.

### 6. Reactor Container

Use a transparent borosilicate 250 mL vessel for the current prototype view.

Include:

- Transparent glass
- Reactor liquid
- DS18B20 probe
- Heat exchanger
- Liquid level
- Capacity marking
- Temperature label

Do not automatically color the current reactor medium bright green as if algae cultivation has been demonstrated.

Use neutral or experimentally appropriate liquid appearance for the thermal prototype.

Reserve green Spirulina culture for the clearly marked planned biological-mode visualization.

### 7. ESP32 Controller

Create a recognizable ESP32 development board.

Include:

- PCB
- USB connector
- GPIO headers
- Controller chip
- Sensor wires
- Relay signal connection

No need to make every microscopic circuit component geometrically detailed.

Prioritize believable appearance and clear engineering relationships.

### 8. Sensors

Model and label:

- DS18B20 temperature sensor
- MQ-135 relative gas sensor

Allow users to click each sensor to view:

- Sensor type
- Location
- GPIO connection
- Reading
- Unit
- Last update
- Validity
- Data source

---

# 9. 3D CAMERA AND INTERACTION

Implement:

- Orbit camera control
- Smooth zoom
- Panning
- Front view
- Top view
- Isometric view
- Exploded view
- Reset camera
- Fit apparatus to screen
- Component selection
- Hover highlights
- Technical tooltips
- Optional fullscreen mode

Add a floating scene toolbar:

**Normal | Exploded | Top | Reset**

## Exploded View

Animate logical separation of components:

- Heater
- Block #1
- Pump
- Tubing
- Block #2
- Reactor
- ESP32

Keep wires and tube connections comprehensible.

## Component Inspector

When a component is clicked, open a side panel containing:

- Component name
- Specification
- Engineering role
- Electrical or fluid connections
- Live state if measurable
- Safety notes where appropriate

Never fabricate measured values for a clicked component.

---

# 10. PHYSICS-BASED VISUAL BEHAVIOR

Make the 3D environment react to real telemetry.

### Heater Active

- Amber indicator illuminates
- Heater status changes
- A reported relay event is logged

### Reactor Temperature Rises

- Temperature label updates
- Chart updates
- Reactor status color changes according to a documented scale

### Pump Operation

- Display verified flow only when real flow telemetry exists.
- Otherwise show an illustrative flow visualization with the label "Flow not instrumented."

### Sensor Reading Changes

- Sensor readout updates
- Trend chart receives a new data point
- Timestamp refreshes

### Safety Fault

- Heater-active visualization turns off according to the firmware-reported output state
- Fault banner appears
- Relevant equipment receives a red outline
- Event is logged

### ESP32 Disconnected

- Live indicators change to offline
- Commands become unavailable
- Chart recording pauses
- Last values are visibly marked stale

Never generate fictitious measured values during disconnection.

---

# 11. REAL-TIME HARDWARE COMMUNICATION

Implement USB Web Serial first.

## Connection Workflow

1. User clicks "Connect ESP32."
2. Browser opens device-port selection.
3. User chooses the ESP32 serial port.
4. Application opens communication at 115200 baud.
5. Incoming serial data is read continuously.
6. JSON lines are parsed and validated.
7. Telemetry updates the application state.
8. Dashboard components react.
9. User commands are transmitted only after validation.
10. Firmware acknowledgement or reported state determines the displayed outcome.

Use the native browser Web Serial API with user-initiated permission.

Provide actionable error messages when Web Serial is unsupported.

Support connection cleanup and reconnection.

Ensure the serial port is not being used simultaneously by the Arduino Serial Monitor.

## Baseline Telemetry Message

Support this existing format:

```json
{"temp":34.2,"gas":1830,"heater":1,"fault":0}
```

Interpretation:

- `temp`: DS18B20 temperature reading
- `gas`: MQ-135 relative sensor reading
- `heater`: Firmware-reported relay/heater state
- `fault`: Firmware-reported safety state

Do not interpret `gas` as calibrated CO₂ ppm.

## Existing Control Messages

Support:

```json
{"heater":1}
```

And:

```json
{"heater":0}
```

Do not require an incompatible new command protocol unless firmware and frontend are modified together.

## Extended Protocol

If beneficial, introduce a versioned telemetry format containing:

- Device ID
- Message version
- Sequence number
- Timestamp
- Sensor validity
- Fault reason
- Command ID
- Acknowledgement
- Optional source-side temperature
- Optional measured flow rate

Maintain compatibility with the existing device wherever possible.

---

# 12. SYSTEM STATUS PANEL

Recreate the right-side System Status section.

At the top:

**System Status**

Show:

- Device connection
- Device name
- Communication interface
- Last update
- Telemetry latency or age
- Fault state

## Status Card 1 — Reactor Temperature

Show:

- Temperature in °C
- Mini trend chart
- Target or operating window
- Safety limit
- Sensor validity

Distinguish the operating target from the fixed firmware safety cutoff.

## Status Card 2 — Heater Status

Show:

- ON / OFF / UNKNOWN
- Relay-reported state
- Commanded state
- Last transition timestamp

Do not show a measured heat-source temperature without a dedicated sensor.

## Status Card 3 — Pump Status

Show:

- Pump supply configuration
- Whether flow is instrumented
- Verified status where available

If no flow sensor or pump-control feedback exists, display:

**Pump Status: Not Instrumented**

Do not show a verified ON status merely because the pump is wired directly to 12 V.

## Status Card 4 — Gas Sensor

Show:

- MQ-135 relative sensor reading
- Raw ADC or calibrated relative-unit representation
- Sparkline
- Sensor status
- Last update

Never rename this as measured carbon captured.

---

# 13. SIMULATED AI WORKLOAD PANEL

Recreate the workload panel shown in the screenshot.

Title:

**Simulated AI Workload**

Subtitle:

"Simulate computing demand to drive the thermal test vehicle."

Include:

- Workload slider from 0–100%
- Low preset
- Medium preset
- High preset
- Auto mode
- Workload activity bars
- Current simulation percentage

The workload represents a simulation input.

It is not actual CPU utilization unless a real system measurement is separately implemented.

## Heater Trigger Logic

Implement the load-to-heater control behavior specified in the latest project README, including appropriate hysteresis.

The workload requests heater operation.

The ESP32 independently decides whether the request is safe.

Do not let React bypass the firmware safety rules.

---

# 14. REAL-TIME TEMPERATURE CHART

Use Apache ECharts.

Include:

- X-axis: time
- Y-axis: °C
- Live reactor temperature
- Optional verified heat-source temperature
- Configurable time window
- Hover tooltips
- Zoom
- Pause chart rendering
- CSV export
- Historical view

The screenshot displays green and orange temperature lines.

Implement the green line from actual reactor telemetry.

Display the orange line only when a second real temperature source is available or when explicitly labeled as estimated.

Do not fabricate a heater-temperature line simply to match the visual reference.

---

# 15. GAS SENSOR TREND CHART

Create a purple time-series graph.

Title:

**Gas Sensor Trend**

Subtitle:

"MQ-135 — Relative Sensor Value"

Features:

- Live readings
- Timestamps
- Chart zoom
- Inspection tooltip
- Connection-state warnings
- CSV export

Show raw measurements correctly.

Do not call this graph CO₂ sequestration or carbon removal unless a suitable calibrated CO₂ measurement system is integrated and experimentally validated.

---

# 16. REACTOR MODE SELECTOR

Implement three separate modes.

## Mode 1 — Thermal Demo

**CURRENT BASELINE**

The current project apparatus:

- Simulated AI workload
- Heater control
- Liquid cooling
- Reactor temperature monitoring
- Firmware safety protection

This is the default operational mode.

## Mode 2 — Chemical Research

**PLANNED / EXPERIMENTAL**

Visualize the proposed calcium-hydroxide mineralization system.

Reaction:

Ca(OH)₂ + CO₂ → CaCO₃ + H₂O

Provide research fields for:

- Experiment conditions
- Reagent concentration
- Reactor temperature
- Gas exposure
- Observed precipitation
- Calibrated measurements when available

Do not automatically claim the chemical reaction has been experimentally verified by the current dashboard.

## Mode 3 — Biological Research

**PLANNED**

Visualize a dedicated Spirulina photobioreactor.

Include:

- Transparent algae cultivation container
- LED lighting
- Culture volume
- Heat exchanger
- CO₂ inlet
- Gas outlet
- Temperature sensor
- pH measurement provision
- Mixing system

All biological growth and carbon fixation results must originate from valid experiments.

Switching into a planned mode must not issue unexpected physical heater commands.

---

# 17. QUICK CONTROLS

Recreate the screenshot's Quick Controls card.

Include:

- Heater ON request
- Heater OFF request
- Emergency OFF
- Control authorization status
- Temperature operating target, if supported by firmware
- Current safety cutoff display
- Command acknowledgement
- Last command result

## Safety Rules

1. Heater ON requests are disabled while disconnected.
2. Commands must be validated.
3. The firmware must enforce the hard temperature cutoff.
4. A missing temperature sensor must cause a safe state.
5. Communication timeout must force heater shutdown according to the implemented firmware.
6. The UI cannot override firmware interlocks.
7. Emergency OFF must have high visual priority.
8. The UI must clearly state that an offline browser cannot physically transmit an OFF command; hardware-level protection must remain effective.
9. Do not make the hardcoded 35.5°C safety cutoff freely editable in the dashboard unless a separately validated firmware design explicitly supports that functionality.

A UI control must never claim success before hardware acknowledgement or reported state confirmation.

---

# 18. RECENT EVENTS PANEL

Implement an event log matching the screenshot.

Examples of actual recorded event types:

- Device connected
- Device disconnected
- Telemetry received
- Heater command sent
- Heater command acknowledged
- Heater switched ON
- Heater switched OFF
- Safety fault
- Temperature threshold reached
- Sensor unavailable
- Experiment started
- Experiment stopped

Each event should include:

- Timestamp
- Severity
- Source
- Description
- Relevant device ID
- Optional command ID

Support event filtering and export.

The Clear button should operate on the local event view or explicitly defined history scope.

Do not silently delete permanently stored scientific experiment records.

---

# 19. EXPERIMENT MANAGEMENT

Create a professional research-session interface.

Include:

- New experiment
- Experiment name
- Experiment objective
- Reactor mode
- Start timestamp
- End timestamp
- Recorded telemetry
- Operator notes
- Device configuration
- Temperature history
- Heater event history
- Fault events
- Data export

Support replay of recorded sessions through the 3D digital twin.

Mark replay distinctly from live monitoring.

Use measured data for scientific calculations.

For thermal energy:

Q = m × Cp × ΔT

Require the relevant mass, temperature change, and assumptions.

Do not present this calculation as direct proof of recovered server waste heat or carbon removal.

---

# 20. ANALYTICS WORKSPACE

Create analytics sections for:

### Thermal Performance

- Temperature change over time
- Heating duration
- Heater duty cycle
- Reactor thermal response
- Heat-transfer experiment comparison

### Device Reliability

- Connection interruptions
- Sensor invalid states
- Safety trips
- Command failures

### Experiment Comparison

- Run-to-run temperature curves
- Different workload simulations
- Different reactor configurations

### Sustainability Research

Clearly separate:

- Directly measured quantities
- Derived thermal calculations
- Estimates
- Projections
- Unverified impact claims

Do not show fictional kilograms of carbon captured, energy savings, or efficiency improvements.

---

# 21. AI ASSISTANT

Create an optional AI Assistant screen.

If Ollama is installed and configured, connect a compatible local language model.

Capabilities:

- Explain recorded telemetry
- Summarize experiment sessions
- Interpret temperature trends
- Explain hardware components
- Help identify missing measurements
- Provide scientific explanations
- Generate research summaries

Restrictions:

- AI cannot directly control dangerous actuators.
- AI cannot override safety cutoffs.
- AI cannot fabricate measurements.
- AI must distinguish recorded observations from hypotheses.
- AI-generated scientific interpretations must be labeled as analysis, not verified results.

If Ollama is unavailable, show a clear setup status rather than pretending the assistant is connected.

---

# 22. HARDWARE SETUP PAGE

Implement a complete interactive hardware setup guide.

Include the actual GPIO mapping:

| Hardware | Connection |
|---|---|
| DS18B20 DATA | GPIO 4 |
| DS18B20 VDD | 3.3 V |
| DS18B20 GND | GND |
| 4.7 kΩ resistor | DATA to 3.3 V |
| Relay IN | GPIO 23 |
| MQ-135 AO | GPIO 34 through verified voltage conditioning |
| ESP32 | USB to computer |
| PTC heater | 12 V supply via DC-rated switching |
| R385 pump | Separate 12 V power branch |

Add visual diagrams for:

- Electrical connections
- ESP32 pin mapping
- Power separation
- Cooling-liquid loop
- Reactor instrumentation
- Communication architecture

Explain how to:

1. Connect ESP32.
2. Install firmware.
3. Select the correct serial port.
4. Check incoming telemetry.
5. Test relay logic with heater power disconnected.
6. Confirm safety cutoffs.
7. Perform controlled hardware testing.
8. Diagnose connection failures.

Include appropriate warnings about hot surfaces, DC switching capacity, leaks, electrical isolation, and alkaline chemicals.

---

# 23. SIMULATION MODE

Create a simulation mode for software testing and judge demonstrations when physical hardware is unavailable.

Simulation mode must be visibly different from Live Hardware mode.

Use a persistent label:

**SIMULATION — NO PHYSICAL DEVICE CONNECTED**

Simulation must include:

- Configurable simulated workload
- Plausible thermal response model
- Simulated relay state
- Simulated reactor temperature
- Virtual safety trip
- Synthetic gas-sensor trace
- Simulated event logs

Every generated measurement must carry simulation metadata.

Never mix simulated and real measurements in the same graph without clearly distinguishing them.

Switching between modes must safely terminate or suspend the previous data source.

The app must not automatically connect to hardware or energize the heater when the user enters the dashboard.

---

# 24. DATA STORAGE

For the USB-only prototype, support local session state and optional export or safe browser storage as appropriate.

For the advanced backend version, design storage for:

- Devices
- Telemetry
- Experiments
- Commands
- Acknowledgements
- Fault logs
- Device configuration
- Historical datasets

Use appropriate timestamps, units, and data-source labels.

Handle offline data and reconnects reliably.

Do not invent continuity in the measured time series when telemetry is missing.

---

# 25. 3D PERFORMANCE OPTIMIZATION

The digital twin must remain responsive on ordinary modern laptops.

Implement:

- Optimized geometry
- Reusable materials
- Geometry instancing where appropriate
- Limited dynamic lighting
- Controlled shadow quality
- Reduced draw calls
- Lazy-loaded models
- Responsive camera bounds
- Quality settings
- GPU capability checks
- Fallback presentation when WebGL is unavailable

Use animation only when the scene is visible or when necessary.

Do not create expensive particle systems that provide no technical value.

Include Reduced Motion support.

Measure real performance before making frame-rate claims.

---

# 26. ACCESSIBILITY AND INTERACTION

Ensure:

- Keyboard-accessible controls
- Descriptive accessible labels
- Clear focus indicators
- Readable contrast
- Tooltips for technical values
- Consistent loading states
- Error messages with recovery actions
- Responsive layouts
- Screen-reader-friendly status announcements
- User-confirmed destructive actions
- No status indication based only on colour

Use proper units and labels across all charts.

---

# 27. PROJECT STRUCTURE

Create an organized codebase.

```text
algaerhythm-dashboard/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── dashboard/
│   │   │   ├── telemetry/
│   │   │   ├── controls/
│   │   │   └── charts/
│   │   ├── digital-twin/
│   │   │   ├── scene/
│   │   │   ├── models/
│   │   │   ├── materials/
│   │   │   ├── animations/
│   │   │   └── interactions/
│   │   ├── hardware/
│   │   │   ├── web-serial/
│   │   │   ├── protocol/
│   │   │   └── telemetry/
│   │   ├── pages/
│   │   ├── stores/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── styles/
│   ├── public/
│   │   └── models/
│   └── package.json
│
├── firmware/
│   └── esp32/
│
├── backend/
│   └── optional-services/
│
├── docs/
│   ├── architecture/
│   ├── electrical/
│   ├── cooling-system/
│   ├── communication/
│   └── testing/
│
├── tests/
├── README.md
├── DEV_LOG.md
└── .gitignore
```

Adjust this structure based on the existing repository.

Do not create empty modules merely to give the appearance of completion.

---

# 28. IMPLEMENTATION PHASES

Execute development in the following order.

## Phase 1 — Inspect Existing Project

- Read project documentation.
- Inspect repository and Git history.
- Identify implemented and planned features.
- Identify current firmware commands.
- Document architecture decisions.

## Phase 2 — UI Foundation

- Set up React, TypeScript, Vite and Tailwind.
- Implement design tokens.
- Recreate the dashboard shell.
- Build navigation and cards.
- Match the reference screenshot.
- Make the layout responsive.

## Phase 3 — Telemetry Infrastructure

- Implement typed telemetry models.
- Implement message validation.
- Build a centralized telemetry store.
- Add connection-state management.
- Add device timestamps and stale-data detection.

## Phase 4 — Real ESP32 Connection

- Implement Web Serial.
- Add serial-port selection.
- Parse real telemetry.
- Add connection recovery.
- Implement command handling.
- Validate firmware compatibility.

## Phase 5 — 3D Digital Twin

- Create accurate 3D equipment models.
- Implement coolant tubing.
- Configure lighting and cameras.
- Add component selection.
- Add exploded view.
- Bind telemetry to visual states.

## Phase 6 — Analytics and Monitoring

- Implement temperature charts.
- Add gas-sensor trends.
- Add device status cards.
- Add real event logging.
- Add experiment history.

## Phase 7 — Safe Controls

- Validate heater requests.
- Implement command acknowledgements.
- Reflect firmware safety.
- Add emergency OFF handling.
- Test communication loss behavior.

## Phase 8 — Research Modes

- Implement thermal mode.
- Add chemical research visualization.
- Add planned Spirulina reactor visualization.
- Clearly distinguish unimplemented hardware.

## Phase 9 — AI and Advanced Features

- Add optional Ollama integration.
- Add experiment summaries.
- Add optional backend/database.
- Add network communication only where required.

## Phase 10 — Final Testing

- Unit tests
- Integration tests
- Browser tests
- Hardware connectivity tests where possible
- Accessibility tests
- Performance review
- Responsive-layout review
- Documentation validation

Do not advance by declaring a phase complete without verifying its acceptance criteria.

---

# 29. REQUIRED TEST SCENARIOS

At minimum, verify:

1. Dashboard loads without hardware.
2. Disconnected status is displayed correctly.
3. Simulation mode is clearly labeled.
4. Compatible browser can request an ESP32 serial port.
5. Valid serial JSON updates telemetry.
6. Invalid JSON does not crash the application.
7. Missing sensors produce unavailable states.
8. Heater command UI waits for actual state confirmation.
9. Fault telemetry updates the UI.
10. Stale telemetry is identified.
11. Disconnect closes or releases resources correctly.
12. 3D view updates from incoming readings.
13. Pump status is not falsely reported.
14. Reactor modes show correct implementation status.
15. Charts avoid fake live data.
16. Exploded view works.
17. Navigation routes work.
18. Responsive layouts remain usable.
19. Keyboard interaction is supported.
20. Production build succeeds.

When actual hardware is unavailable, test with simulated fixtures and report the limitation.

Never claim hardware tests passed unless they were actually performed.

---

# 30. FINAL QUALITY REQUIREMENTS

The completed application must satisfy five quality dimensions.

## Visual Fidelity

The application closely resembles the reference screenshot in composition, colour, spacing, and atmosphere.

## Functional Completeness

Navigation, charts, controls, mode selection, device connection, and 3D interactions have meaningful implemented behavior.

## Hardware Integrity

Real measurements come from real hardware.

Commands are validated, and hardware safety remains independent of the browser.

## Scientific Honesty

No false CO₂ measurements, fabricated carbon-capture results, or simulated data presented as experimental evidence.

## Engineering Quality

Maintainable architecture, strict typing, tests, robust error handling, useful documentation, and clear installation instructions.

---

# 31. FINAL DELIVERABLES

Generate:

1. Complete React/TypeScript application.
2. Fully working dashboard interface.
3. Interactive 3D apparatus.
4. Web Serial ESP32 communication layer.
5. Real-time telemetry charts.
6. Hardware status panels.
7. Safe heater-control interface.
8. Workload simulation module.
9. Reactor mode interfaces.
10. Experiment logging.
11. Analytics workspace.
12. Optional AI assistant.
13. Optional FastAPI services.
14. ESP32 integration documentation.
15. GPIO wiring diagrams.
16. Installation and running instructions.
17. Automated test suite.
18. README.
19. DEV_LOG.
20. Final feature-status and testing report.

Explain exactly how to start the project and connect a real ESP32.

Separate implemented features from unverified hardware functions and future extensions.

---

# 32. FINAL EXECUTION DIRECTIVE

**Build the AlgaeRhythm dashboard shown in the uploaded image as an actual professional industrial digital twin application.**

Preserve the screenshot's layout and visual identity.

Make the central 3D apparatus the visual focal point.

Build every panel as a genuine application component.

Prioritize real ESP32 connectivity, scientific accuracy, and safe hardware integration over decorative effects.

Do not stop after generating UI mockups, component outlines, placeholder screenshots, or project scaffolding.

Start by inspecting the existing repository and project documents.

Then implement the working dashboard incrementally, run available tests, correct errors, and document verified results.

Where physical hardware or optional services are unavailable, complete the testable software components and explicitly report remaining acceptance tests.

**FINAL PRODUCT VISION:**

A premium sustainability-research control center where users can inspect the AlgaeRhythm apparatus in 3D, connect real ESP32 hardware, monitor thermal behavior, safely control the demonstration, record experiments, and explore future carbon-capture research.

**BEGIN IMPLEMENTATION NOW.**