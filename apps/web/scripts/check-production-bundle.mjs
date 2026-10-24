// Builds the app with the production values of specs/008-web-production-env/data-model.md and fails if the
// bundle contains a `localhost:<port>` address (SC-003 / FR-007): application config must never point a
// visitor's browser at its own machine (the regression this guards: the retired coins client of server/ defaulting to
// http://localhost:4000; coins now go through the same-origin /backend, specs/011-web-coins-real-api).
//   pnpm check:production-bundle
//
// What is NOT a failure, on purpose: bare `localhost` words inside third-party library code — cookie
// public-suffix lists, socket.io/axios/router fallbacks used as a URL *base*, MSW internals — and the
// documented `ws://localhost/realtime` default of VITE_SOCKET_URL (a route id for the socket MSW simulates).
// Those are counted and printed for information only.
import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const env = { ...process.env, VITE_ENABLE_MOCKS: 'true', VITE_ENABLE_BACKEND_MOCKS: 'false' }

const build = spawnSync(process.execPath, ['./node_modules/vite/bin/vite.js', 'build'], { env, stdio: 'inherit' })
if (build.status !== 0) process.exit(build.status ?? 1)

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* files(path)
    else if (/\.(js|css|html|json)$/.test(name)) yield path
  }
}

const offenders = []
let informational = 0
for (const file of files('dist')) {
  const text = readFileSync(file, 'utf8')
  for (const match of text.matchAll(/localhost:\d+/g)) {
    offenders.push(`${file}: …${text.slice(Math.max(0, match.index - 40), match.index + 40).replace(/\s+/g, ' ')}…`)
  }
  informational += text.split('localhost').length - 1
}

if (offenders.length > 0) {
  console.error(`\n✗ ${offenders.length} localhost:<port> address(es) in the production bundle:`)
  for (const line of offenders.slice(0, 20)) console.error(`  ${line}`)
  process.exit(1)
}
console.log(`\n✓ No localhost:<port> address in dist/ (${informational} bare "localhost" mention(s) in library code, informational).`)
