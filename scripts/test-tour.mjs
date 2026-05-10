#!/usr/bin/env node
// E2E smoke test for the guided house tour.
// Loads the app, runs the tour, switches camera modes, records a clip,
// captures all console errors. Exits non-zero on any console error.
//
// Usage:
//   npm run dev    # in another terminal
//   node scripts/test-tour.mjs
//
// Env:
//   URL    base URL (default http://localhost:5173)
//   SHOTS  directory for screenshots + downloaded WebM (default ./tmp/tour-shots)

import { existsSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const URL = process.env.URL || 'http://localhost:5173'
const SHOTS = process.env.SHOTS || resolve(dirname(fileURLToPath(import.meta.url)), '../tmp/tour-shots')
mkdirSync(SHOTS, { recursive: true })

const require = createRequire(import.meta.url)
const resolvePlaywright = () => {
  try { return require.resolve('playwright') } catch {}
  for (const p of ['/usr/lib/node_modules/playwright/index.js', '/usr/local/lib/node_modules/playwright/index.js']) {
    if (existsSync(p)) return p
  }
  throw new Error('playwright not found; install with `npm i -D playwright` or system package')
}
const pw = (await import(resolvePlaywright())).default
const { chromium } = pw

const errs = []
const main = async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errs.push(`[console] ${m.text()}`) })
  page.on('pageerror', (e) => errs.push(`[pageerror] ${e.message}`))
  page.on('requestfailed', (r) => errs.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`))

  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${SHOTS}/01-loaded.png` })

  const start = page.getByRole('button', { name: /Start tour|Iniciar tour/i }).first()
  if (!(await start.count())) throw new Error('Start tour button not found')
  if (await start.isDisabled()) throw new Error('Start tour button disabled (no tour: defined?)')
  await start.click()
  // Wait until the guide reaches a dwell point so they stand still in the frame.
  await page.waitForFunction(
    () => window.__tour && (window.__tour.dwell > 0 || window.__tour.idx >= 7),
    null, { timeout: 25000 }
  ).catch(() => {})
  await page.screenshot({ path: `${SHOTS}/02-tour-third.png` })

  for (const [name, file] of [
    [/First-person|Primeira pessoa/i, '03-first-person.png'],
    [/Cinematic|Cinematográfico/i, '04-cinematic.png'],
    [/Third-person|Terceira pessoa/i, '05-third-again.png'],
  ]) {
    const btn = page.getByRole('button', { name }).first()
    await btn.click()
    await page.waitForTimeout(1800)
    await page.screenshot({ path: `${SHOTS}/${file}` })
  }

  const dlPromise = page.waitForEvent('download', { timeout: 8000 }).catch(() => null)
  const recBtn = page.getByRole('button', { name: /^Record$|^Gravar$/i }).first()
  if (await recBtn.count() && !(await recBtn.isDisabled())) {
    await recBtn.click()
    await page.waitForTimeout(2500)
    await page.getByRole('button', { name: /Stop recording|Parar gravação/i }).first().click()
    const dl = await dlPromise
    if (dl) {
      const out = `${SHOTS}/${dl.suggestedFilename()}`
      await dl.saveAs(out)
      console.log('recorded:', out)
    } else {
      errs.push('recording: no download captured')
    }
  } else {
    console.log('recording: unsupported in this browser; skipped')
  }

  const stop = page.getByRole('button', { name: /Stop tour|Parar tour/i }).first()
  if (await stop.count()) await stop.click()

  await browser.close()
  if (errs.length) {
    console.error('\nFAIL — console/page errors:')
    for (const e of errs) console.error(' -', e)
    process.exit(1)
  }
  console.log('\nOK — tour ran with no errors. Shots in', SHOTS)
}

main().catch((e) => { console.error('FATAL', e); process.exit(2) })
