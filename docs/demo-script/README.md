# Judge demonstration

## Software-only, no external services required

1. Start with `npm ci && npm run dev`. Show disconnected instruments and unavailable readings.
2. Show the 3D rig: orbit, labels, exploded view, top view, component selection. Identify the independent pump branch and isolated reactor exchanger.
3. In Settings, choose 30× thermal simulation if a short presentation requires visible heating. Explain the amber source label and accelerated time.
4. Start Simulation. Open Compute Demo and run attention-model inference. Show actual completed numerical jobs, measured worker time and calculated throughput. Explain synthetic weights and that this is not a real remote data centre.
5. Enable explicit workload coupling. Explain requested workload → duty demand → hysteresis/dwell → firmware/simulator authority. Show reported heater state only after acknowledgement.
6. Return to Dashboard and watch recorded reactor temperature. MQ-135 is a synthetic relative ADC trace in this mode; never call it CO₂ ppm.
7. In Controls, inject a thermal trip. Show the latch, disabled ON control and OFF state. Restore the sensor/cooldown, explicitly reset, and explain that reset leaves heat OFF.
8. Start heater again and pause heartbeat. After >3 seconds show LINK_TIMEOUT and OFF. Resume heartbeat and reset only after the source is safe.
9. Visit Experiments, rename/annotate the run, download CSV, compare runs and replay. Point to `source=simulated` in the export.
10. Show chemical research and planned Spirulina screens. Explain missing measurements and that warm water alone does not capture carbon.

## Optional actual LLM

Run a locally configured Ollama model in AI Assistant. The UI shows real streamed text or an explicit error. After generation, the operator can request the transparently calculated 5–20 s burst. The model cannot issue commands.

## Physical acceptance (must be performed separately)

Use the hardware wiring checklist and a test lamp first. Verify fresh real serial data within the specified sampling interval; active polarity; boot OFF; E-stop; sensor disconnect; thermal threshold; second-probe behavior; USB removal; hidden tab; minimum relay dwell and explicit cooldown reset. Confirm independent thermometer agreement, real flow, leak resistance, DC contact ratings and fuse suitability. Record results with timestamps, wiring photos and operator signoff. None of these physical tests was performed during software development.
