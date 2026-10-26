# Deployment

Repository: https://github.com/kishore-23MIC0100/THERMO-GREEN

Deployment target: Vercel production, project `thermo-green`, in the connected `iDev` team (`i-dev1`). GitHub's existing initial commit is retained. The repository stores no credentials or browser experiment data.

Build settings:

- Root: repository root (the npm workspace includes frontend and shared configuration)
- Install: `npm ci`
- Build: `npm run build`
- Output: `frontend/dist`
- Framework: Vite
- Node: 22.x
- No environment variables or cloud backend are required for the dashboard, simulator or numerical compute demo.

`vercel.json` supplies SPA routing, CSP, a same-origin serial permission policy and other response headers. The browser remains the sole owner of local experiment records. Physical serial access requires a compatible browser and explicit device selection. Optional local Ollama access is subject to the browser's local-network permissions and the service's origin allowlist; use localhost for that part of the demonstration.

After publication, the remote browser suite can be run with:

```sh
PLAYWRIGHT_BASE_URL=https://YOUR-PRODUCTION-DOMAIN npm run test:e2e
```

This runs the same source-labelled simulator, real compute worker, USB mock, safety, storage/replay, accessibility and navigation scenarios against the deployed assets. Physical hardware commissioning remains separate.

Publication and deployment verification results will be appended after they are observed.
