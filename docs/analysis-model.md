# Local Ollama analysis model

AlgaeRhythm includes an optional, local Ollama assistant for explaining the currently recorded experiment session. The assistant has no hardware-control tools. It receives the current session summary and the operator's question; firmware remains the heater safety authority.

## Build the project profile

Install [Ollama](https://ollama.com) and make sure its local service is running. From the repository root:

```sh
npm run model:build
```

This creates `thermo-green-analyst:latest` from the locally installed `qwen2.5:3b` model. The build requires the base model once:

```sh
ollama pull qwen2.5:3b
npm run model:build
```

The Modelfile sets project-specific system instructions, generation parameters, and a small set of example exchanges. This is **instruction/prompt tuning**, not a gradient-based fine-tune: it does not update Qwen's neural-network weights or create new scientific knowledge. It creates a reproducible local Ollama model profile. No training data is uploaded. For a real weight fine-tune, prepare a reviewed dataset and use a compatible fine-tuning toolchain separately, then import the resulting adapter/model into Ollama.

To inspect or invoke the model directly:

```sh
ollama show thermo-green-analyst:latest
ollama run thermo-green-analyst:latest
```

## Connect the dashboard

In **Settings → Ollama model**, enter `thermo-green-analyst:latest`. Then open **AI Research Assistant** and choose **Check Ollama**. Fresh browser settings default to this project profile; browsers with a saved model choice keep their existing selection until changed.

For the local Vite dashboard, start Ollama with the allowed origins:

```sh
OLLAMA_ORIGINS=http://localhost:5173,http://127.0.0.1:5173 ollama serve
```

For the hosted dashboard, include its exact origin in `OLLAMA_ORIGINS` and grant the browser's local-network permission when prompted. Keep Ollama bound to loopback; never expose its API publicly. The hosted page still sends session data from the browser to the operator's configured local Ollama service.

## What the profile is taught

- Source and time-range attribution, evidence labels, and explicit “insufficient data” handling.
- Thermal-ramp analysis using time-stamped reactor samples and stated heat-capacity/power assumptions.
- Limits of this hardware: raw relative MQ-135 ADC only; no measured electrical power or coolant flow; no demonstrated carbon capture or algae growth.
- Project thermal/safety limits and the rule that telemetry and model advice never supersede firmware interlocks.

## Rebuild after changing instructions

Edit `ollama/Modelfile`, then run `npm run model:build` again. The resulting model tag is local to that Ollama installation; rebuilding elsewhere requires pulling the base model and running the same command.
