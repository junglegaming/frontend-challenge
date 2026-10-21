// Lighthouse audit of the public pages against the production build (`pnpm build` first).
//   pnpm lighthouse                      # audits / and /nft/nft_001
//   LIGHTHOUSE_URLS=/,/design-system pnpm lighthouse
// Fails when the accessibility score is below 95. Uses the Chromium that Playwright already installs.
import { spawn } from 'node:child_process'
import lighthouse from 'lighthouse'
import { chromium } from '@playwright/test'

const PORT = 4174
const DEBUG_PORT = 9223
const BASE = `http://localhost:${PORT}`
const PATHS = (process.env.LIGHTHOUSE_URLS ?? '/,/nft/nft_001').split(',')
const MIN_ACCESSIBILITY = 95

const server = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
})

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(BASE)).ok) return
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
    const { lhr } = await lighthouse(`${BASE}${path}`, { port: DEBUG_PORT, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices'] })
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
