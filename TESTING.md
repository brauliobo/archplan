# Testing

## End-to-end tour smoke test

`scripts/test-tour.mjs` is a Playwright script that drives the running app:
loads the sample plan, starts the guided tour, switches camera modes,
records a short WebM clip, and asserts that no console / page errors
fire during the run.

### Prerequisites

- `playwright` available — either as a project dep or system-installed
  (`/usr/lib/node_modules/playwright` is auto-detected on Arch).
- A Chromium browser binary that Playwright can launch (the `playwright`
  package bundles one; the system `chromium` package also works).

### Run

```bash
# terminal 1
npm run dev

# terminal 2
node scripts/test-tour.mjs
# or override URL / output dir
URL=http://localhost:5174 SHOTS=/tmp/shots node scripts/test-tour.mjs
```

Exit code is `0` on success, `1` if any console error or page error was
captured, `2` on a fatal exception.

### Output

- Screenshots: `tmp/tour-shots/01-loaded.png` through `05-third-again.png`.
- Recorded WebM: `tmp/tour-shots/tour-<timestamp>.webm` (when the
  browser supports `MediaRecorder` with a WebM codec — Chromium yes,
  Safari no).

### What it verifies

- App renders without React/runtime errors.
- The Start tour button is enabled when the loaded plan defines a `tour:` block.
- The tour controller drives the guide through the polyline and updates
  door states (visually verifiable in the screenshots).
- All three camera modes mount without throwing.
- `useTourRecorder` produces a non-empty WebM download.
