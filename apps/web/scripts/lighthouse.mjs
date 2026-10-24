// Lighthouse audit of the public pages against the production build (`pnpm build` first).
//   pnpm lighthouse                      # audits / and /nft/nft_001 on a local `vite preview`
//   LIGHTHOUSE_URLS=/,/design-system pnpm lighthouse
//   LIGHTHOUSE_BASE_URL=https://<deploy>.vercel.app pnpm lighthouse   # audits a PUBLISHED deploy instead
//   LIGHTHOUSE_BYPASS=<secret>           # only for a protected preview (Vercel protection bypass)
// Fails when the accessibility score is below 95. Uses the Chromium that Playwright already installs.
import { spawn } from 'node:child_process'
import lighthouse from 'lighthouse'
import { chromium } from '@playwright/test'

const PORT = 4174
const DEBUG_PORT = 9223
const PUBLISHED_URL = process.env.LIGHTHOUSE_BASE_URL?.replace(/\/$/, '')
const BASE = PUBLISHED_URL ?? `http://localhost:${PORT}`
const PATHS = (process.env.LIGHTHOUSE_URLS ?? '/,/nft/nft_001').split(',')
const MIN_ACCESSIBILITY = 95
const bypass = process.env.LIGHTHOUSE_BYPASS
const extraHeaders = bypass ? { 'x-vercel-protection-bypass': bypass, 'x-vercel-set-bypass-cookie': 'true' } : undefined

// A published deploy needs no local server.
const server = PUBLISHED_URL
  ? { kill() {} }
  : spawn(process.execPath, ['./node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], {
      stdio: 'ignore',
    })

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(BASE, { headers: extraHeaders })).ok) return
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Preview server did not start on ${BASE}. Run "pnpm build" first.`)
}

let failed = false
const browser = await chromium.launch({ args: [`--remote-debugging-port=${DEBUG_PORT}`] })
try {
  await waitForServer()
  for (const path of PATHS) {
    const { lhr } = await lighthouse(`${BASE}${path}`, { port: DEBUG_PORT, output: 'json', logLevel: 'error', extraHeaders, onlyCategories: ['performance', 'accessibility', 'best-practices'] })
    const score = (id) => Math.round((lhr.categories[id].score ?? 0) * 100)
    const cls = lhr.audits['cumulative-layout-shift'].displayValue
    console.log(`${path}  performance ${score('performance')} · accessibility ${score('accessibility')} · best-practices ${score('best-practices')} · CLS ${cls}`)
    for (const audit of Object.values(lhr.audits)) {
      if (audit.scoreDisplayMode === 'binary' && audit.score === 0 && lhr.categories.accessibility.auditRefs.some((ref) => ref.id === audit.id)) {
        console.log(`  a11y: ${audit.id} — ${audit.title}`)
      }
    }
    if (score('accessibility') < MIN_ACCESSIBILITY) failed = true
  }
} finally {
  await browser.close()
  server.kill()
}
process.exit(failed ? 1 : 0)
