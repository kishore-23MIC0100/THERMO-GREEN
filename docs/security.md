# Security and operations

- No secrets, API keys, analytics endpoints, hosted database or cloud telemetry are needed. `.env*` is ignored. Review local records before intentionally exporting or sharing them.
- ESP32 serial permission is user initiated. The USB-only app has no remote device-control endpoint, authentication system or multi-operator coordination. Do not treat a publicly hosted UI as remote access to a device.
- Validate telemetry with Zod and commands in firmware. Input buffers are bounded; firmware processes a bounded number of serial bytes each cycle. Command acknowledgements are matched to IDs; expired IDs cannot complete a later command.
- All local fonts and procedural 3D assets are bundled. Low quality removes transmission and effects. Browser-local data requires export/backups; storage eviction or clearing can remove records. Persistence requests depend on browser policy.
- CSV text fields are quoted and formula-prefixed strings are escaped. React renders assistant/user notes as text, never raw HTML.
- Ollama endpoints must be loopback HTTP(S) without credentials. Use exact allowed origins, not `*`, and keep the server bound to loopback. Model text is advisory and has no actuator tools. Browser local-network restrictions may prevent hosted-page access; localhost is the supported demo path.
- Production CSP and headers are supplied in `vercel.json` and `frontend/public/_headers`. Inline styles are permitted for ECharts, R3F overlays and CSS variables; scripts stay self-hosted. Verify headers and SPA routing on the selected deployment host before publishing.
- Physical safety is separate from web security. Read the wiring and safety documents before energizing hardware.
