# archplan

AI-driven 2D/3D house planner. Describe a house in natural language; an LLM emits a structured plan that the app validates against architectural standards (NBR 15575 / NBR 9050) and renders as both an SVG floorplan and a Three.js 3D walkthrough.

## Stack
React + Pug (no JSX) + plain ES6 + Vite. Zod schema, `@anthropic-ai/sdk` with forced tool use, Three.js via `@react-three/fiber`. UI strings via YAML i18n with browser-locale auto-detection (`en`, `pt-BR`).

## Local development
```
npm install
npm run dev
```

Then open `http://localhost:5173` and paste your Anthropic API key into the field at the top of the sidebar (it's stored only in `localStorage`).

Optional: pre-fill the key for development by creating `.env.local` with `VITE_ANTHROPIC_API_KEY=sk-ant-...`. Don't ship that to a deployed build.

## Build / preview
```
npm run build      # outputs dist/
npm run preview    # serves dist/ locally
```

## GitHub Pages deploy
The workflow at `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`. It sets `VITE_BASE=/<repo>/` automatically so asset paths resolve under a project page.

To enable:
1. Push the repo to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Trigger the workflow (push to `main` or run manually).

> **API key:** the deployed build does **not** embed any key. Each visitor pastes their own Anthropic key in the UI; it stays in their browser's `localStorage`. The key is sent directly from the browser to `api.anthropic.com` via `dangerouslyAllowBrowser: true`.

## Layout
- `src/schema.js` — Zod `House` schema (single source of truth)
- `src/standards.js` — NBR-based validation, emits i18n keys
- `src/ai/plan.js` — Anthropic call with `emit_house_plan` tool
- `src/ai/apiKey.js` — env-var or localStorage key resolution
- `src/i18n/` — YAML locales + `useT()` hook
- `src/views/Plan2D.js` — SVG floorplan
- `src/views/Plan3D.js` — R3F 3D view
- `plans/` — saved plans
