# AGENTS.md — conventions for AI assistants working on this repo

Read this before making changes. The repo is small and opinionated; some
choices are non-obvious.

## Stack
- React 18 + `@react-three/fiber` + `@react-three/drei` + Three.js
- Vite 5 with `@vitejs/plugin-react` (JSX automatic runtime) and
  `babel-plugin-transform-react-pug` (component bodies are written in
  pug template literals).
- `@rollup/plugin-yaml` to import `.yml` directly.
- Plain JavaScript — **no TypeScript**. Don't introduce `.ts`/`.tsx`.
- Zod (`src/schema.js`) is the single source of truth for the plan
  document shape.

## Pug-React quirks (read this twice)
- Attribute values are raw JS expressions. Do **not** use template-string
  interpolation: `position=[0, ${HEAD_Y}, 0]` is a syntax error.
  Write `position=[0, HEAD_Y, 0]`.
- A pug template that emits more than one top-level node must be wrapped.
  Use `Fragment` (imported from `react`) or any single host element.
  Multiple top-level pug nodes silently produce a runtime "React is not
  defined" error.
- Components from drei / R3F are referenced by their imported name, e.g.
  `OrbitControls(makeDefault enabled=…)`. Lowercase tags become R3F
  intrinsic elements (`mesh`, `group`, `boxGeometry`).

## File layout
- `src/views/Plan2D.js`, `src/views/Plan3D.js` — the two main panes.
- `src/tour/*` — guided-tour feature: schema, path planner, R3F
  controller, camera helpers, in-browser recorder.
- `src/catalog/` — fixtures, room types, materials, sample plans.
- `src/i18n/locales/{en,pt-BR}.yml` — every user-facing string. Default
  locale is `en`; `pt-BR` is auto-selected via `navigator.language`.
- `plans/*.yml` — example floor plans validated against `House` schema.
- `public/models/furniture/*.glb` — fixture meshes loaded via `useGLTF`.
- `public/models/characters/` — guide-tour characters (currently a
  capsule placeholder; drop a CC0 GLB here to upgrade).

## Conventions
- English-first. UI strings, code identifiers, and code comments in
  English. Portuguese only inside `pt-BR.yml` (and inside YAML labels of
  Brazilian-themed sample plans).
- All user-visible strings go through `useT()` — never hard-code a label.
- Keep code short and DRY; prefer one-liners under 120 cols.
- Comments only for non-obvious *why*. Don't narrate what the code does.
- Don't silence errors; let them propagate.
- Don't mock models or DB-backed objects in tests.

## Commits
- Subject prefix: `<context>: <what changed>` (subcontext optional, e.g.
  `tour: path: route through doors via BFS`).
- Stage files individually; never `git add -A` / `git add .`.
- Don't add a `Co-Authored-By` trailer.

## Running things
- `npm run dev` — Vite dev server on :5173 (falls back to :5174 if
  taken).
- `npm run build` / `npm run preview`.
- `node scripts/test-tour.mjs` — see `TESTING.md`.

## When in doubt
- For 3D scene work, study `src/views/Plan3D.js` first; it's the spine.
- For data shape questions, read `src/schema.js`.
- For new fixture categories, add to `src/catalog/fixtures.js` and the
  i18n files together.
