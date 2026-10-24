#!/usr/bin/env node
// One command that proves an environment is healthy (specs/010-api-production-backend/contracts/verification-suite.md).
//   BASE_URL=<origin>/api AUTH_JWT_SECRET=<env secret> [PROTECTION_BYPASS=<secret>]
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... [DIRECT_PROBE_URLS=<comma-separated urls>]
//   node scripts/verify-deploy.mjs [--repeat N] [--skip-admin]
// BASE_URL may be local, a protected preview (PROTECTION_BYPASS) or production, and also the site's
// `/backend` origin to prove the whole chain. Tokens, secrets and hashes are never printed.
import jwt from "jsonwebtoken"

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:4001/api").replace(/\/$/, "")
const { AUTH_JWT_SECRET, PROTECTION_BYPASS, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
const DIRECT_PROBE_URLS = (process.env.DIRECT_PROBE_URLS ?? "").split(",").map((url) => url.trim()).filter(Boolean)

const args = process.argv.slice(2)
const SKIP_ADMIN = args.includes("--skip-admin")
const repeatIndex = args.indexOf("--repeat")
const REPEAT = repeatIndex === -1 ? 1 : Number(args[repeatIndex + 1])
if (!Number.isInteger(REPEAT) || REPEAT < 1) {
  console.error("--repeat needs a positive integer.")
  process.exit(2)
}

const CONCURRENT_OPERATIONS = 50
const LATENCY_SAMPLES = 20
const LATENCY_LIMIT_MS = 2000

let failures = 0
let lostUpdate = false
let runCounter = 0

const ok = (message) => console.log(`✓ ${message}`)
const fail = (message) => {
  failures += 1
  console.error(`✗ ${message}`)
}
const check = (condition, pass, failMessage) => (condition ? ok(pass) : fail(failMessage))

async function request(method, path, { token, body, headers: extra } = {}) {
  const headers = { "Content-Type": "application/json", ...extra }
  if (token) headers.Authorization = `Bearer ${token}`
  if (PROTECTION_BYPASS) headers["x-vercel-protection-bypass"] = PROTECTION_BYPASS
  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    // non-JSON body (e.g. the platform's own error page)
  }
  return { status: res.status, json, text, headers: res.headers }
}

/** True when the platform's anti-bot / rate protection refused the request before it reached the API. */
function isPlatformChallenge(res) {
  return (
    (res.status === 403 || res.status === 429) &&
    (res.headers.has("x-vercel-mitigated") || res.headers.has("retry-after"))
  )
}

async function issueToken(ownerId) {
  const { status, json } = await request("POST", "/auth/token", { body: { ownerId } })
  if (status !== 200 || !json?.token) throw new Error(`could not issue a token for ${ownerId}: HTTP ${status}`)
  return json.token
}

const freshOwner = () => `verify-${Date.now()}-${(runCounter += 1)}`

function p95(samples) {
  const sorted = [...samples].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)]
}

async function runSuite() {
  // 1. Health
  {
    const { status, json } = await request("GET", "/health")
    check(status === 200 && json?.status === "ok", "1  GET /health -> 200 {status: ok}", `1  /health: HTTP ${status} ${JSON.stringify(json?.error ?? json)}`)
  }

  // 2. Structured 404 from the API (not the platform page)
  {
    const { status, json } = await request("GET", "/nao-existe")
    check(status === 404 && typeof json?.error?.code === "string", "2  unknown route -> API's structured 404", `2  expected the API's 404 JSON, got HTTP ${status}`)
  }

  const ownerId = freshOwner()
  const token = await issueToken(ownerId)

  // 3. No token
  {
    const results = await Promise.all(["/coins/balance", "/coins/transactions"].map((path) => request("GET", path)))
    const posts = await Promise.all(["/coins/topup", "/coins/debit"].map((path) => request("POST", path, { body: { amount: 1 } })))
    check([...results, ...posts].every((res) => res.status === 401), "3  /coins/* without a token -> 401", "3  a coins route answered without a token")
  }

  // 4. Tampered / expired token
  {
    const tampered = await request("GET", "/coins/balance", { token: `${token.slice(0, -2)}xx` })
    let expiredStatus = 401
    if (AUTH_JWT_SECRET) {
      const now = Math.floor(Date.now() / 1000)
      const expired = jwt.sign({ sub: ownerId, iat: now - 3600, exp: now - 60 }, AUTH_JWT_SECRET, { algorithm: "HS256" })
      expiredStatus = (await request("GET", "/coins/balance", { token: expired })).status
    } else {
      console.log("  (AUTH_JWT_SECRET not set: expired-token half of check 4 skipped)")
    }
    check(tampered.status === 401 && expiredStatus === 401, "4  tampered and expired tokens -> 401", `4  tampered=${tampered.status} expired=${expiredStatus}, expected 401/401`)
  }

  // 5. Credit -> debit -> balance -> history
  {
    const credit = await request("POST", "/coins/topup", { token, body: { amount: 100 } })
    const debit = await request("POST", "/coins/debit", { token, body: { amount: 40 } })
    const balance = await request("GET", "/coins/balance", { token })
    const history = await request("GET", "/coins/transactions", { token })
    const txs = history.json?.transactions ?? []
    check(
      credit.json?.amount === 100 && debit.json?.amount === 60 && balance.json?.amount === 60 && txs.length === 2 && txs[0]?.direction === "debit" && txs[0]?.resultingBalance === 60,
      "5  credit 100 -> debit 40 -> balance 60, history newest first",
      `5  unexpected flow: credit=${credit.json?.amount} debit=${debit.json?.amount} balance=${balance.json?.amount} history=${txs.length}`,
    )
  }

  // 6. Over-debit
  {
    const over = await request("POST", "/coins/debit", { token, body: { amount: 1000 } })
    const balance = await request("GET", "/coins/balance", { token })
    check(over.status === 402 && balance.json?.amount === 60, "6  debit above the balance -> 402, balance intact", `6  over-debit: HTTP ${over.status}, balance ${balance.json?.amount}`)
  }

  // 7. Owner isolation
  {
    const otherId = freshOwner()
    const otherToken = await issueToken(otherId)
    await request("POST", "/coins/topup", { token: otherToken, body: { amount: 500 } })
    const mine = await request("GET", "/coins/balance", { token })
    const mineHistory = await request("GET", "/coins/transactions", { token })
    const theirs = await request("GET", "/coins/balance", { token: otherToken })
    check(
      mine.json?.ownerId === ownerId && mine.json?.amount === 60 && theirs.json?.ownerId === otherId && theirs.json?.amount === 500 && (mineHistory.json?.transactions ?? []).every((tx) => tx.ownerId === ownerId),
      "7  each token only ever sees its own owner's data",
      "7  owner isolation broken",
    )
  }

  // 8–9. Admin
  if (SKIP_ADMIN) {
    console.log("- 8/9/13/16 admin checks skipped (--skip-admin)")
  } else if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    fail("8  ADMIN_EMAIL and ADMIN_PASSWORD are required (or pass --skip-admin)")
  } else {
    const login = await request("POST", "/admin/login", { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
    const wrongPassword = await request("POST", "/admin/login", { body: { email: ADMIN_EMAIL, password: `${ADMIN_PASSWORD}-wrong` } })
    const unknownEmail = await request("POST", "/admin/login", { body: { email: `nobody-${Date.now()}@example.com`, password: ADMIN_PASSWORD } })
    check(login.status === 200 && typeof login.json?.token === "string", "8  admin login -> 200 with a token", `8  admin login failed: HTTP ${login.status}`)
    check(wrongPassword.status === 401 && unknownEmail.status === 401 && wrongPassword.text === unknownEmail.text, "8  wrong password and unknown e-mail -> identical 401", `8  login failures differ: ${wrongPassword.status}/${unknownEmail.status}`)

    if (login.status === 200) {
      const adminToken = login.json.token
      const adminOnOwner = await request("GET", "/coins/balance", { token: adminToken })
      const ownerOnAdmin = await request("GET", "/admin/me", { token })
      const me = await request("GET", "/admin/me", { token: adminToken })
      check(adminOnOwner.status === 403 && ownerOnAdmin.status === 403 && me.json?.role === "admin", "9  admin token refused on owner routes and the reverse", `9  admin->owner=${adminOnOwner.status} owner->admin=${ownerOnAdmin.status}`)

      // 13. Nothing leaks a hash, and no direct address serves records.
      const bodies = [login.text, me.text, (await request("GET", "/admin/owners?limit=5", { token: adminToken })).text, (await request("GET", `/admin/owners/${encodeURIComponent(ownerId)}`, { token: adminToken })).text]
      const leaked = bodies.some((body) => /scrypt\$|passwordHash|password_hash/.test(body))
      const probes = await Promise.all(
        DIRECT_PROBE_URLS.map(async (url) => {
          const res = await fetch(url).catch(() => null)
          const text = res ? await res.text().catch(() => "") : ""
          return res !== null && res.ok && /scrypt\$|passwordHash|password_hash|"amount"|"ownerId"/.test(text)
        }),
      )
      check(!leaked && !probes.some(Boolean), `13 no response carries a hash; ${DIRECT_PROBE_URLS.length} direct address(es) serve no record`, `13 leak: hashInResponse=${leaked} directProbeServedData=${probes.some(Boolean)}`)

      // 16. Owners pagination: page 2 continues page 1 (ascending ownerId, no repeats). At least 3 owners must exist.
      for (let i = 0; i < 3; i += 1) {
        await request("POST", "/coins/topup", { token: await issueToken(freshOwner()), body: { amount: 1 } })
      }
      const page1 = await request("GET", "/admin/owners?limit=2", { token: adminToken })
      const cursor = page1.json?.cursor
      const page2 = cursor ? await request("GET", `/admin/owners?limit=2&cursor=${encodeURIComponent(cursor)}`, { token: adminToken }) : null
      const ids1 = (page1.json?.owners ?? []).map((owner) => owner.ownerId)
      const ids2 = (page2?.json?.owners ?? []).map((owner) => owner.ownerId)
      const detail = await request("GET", `/admin/owners/${encodeURIComponent(ownerId)}`, { token: adminToken })
      check(
        page1.status === 200 && ids1.length === 2 && typeof cursor === "string" && page2?.status === 200 && ids2.length > 0 &&
          !ids2.some((id) => ids1.includes(id)) && ids1[1] < ids2[0] && detail.status === 200 && detail.json?.balance?.ownerId === ownerId,
        "16 /admin/owners pages with a cursor (no repeats, ascending) and /admin/owners/:ownerId returns that owner",
        `16 pagination/detail broken: page1=${page1.status}(${ids1.length}) cursor=${typeof cursor} page2=${page2?.status}(${ids2.length}) detail=${detail.status}`,
      )
    }
  }

  // 10 + 11. Concurrency and the ledger invariant
  {
    const racer = freshOwner()
    const racerToken = await issueToken(racer)
    const seed = await request("POST", "/coins/topup", { token: racerToken, body: { amount: 100 } })
    const initial = seed.json?.amount ?? 0
    // Half credits of 2, half debits of 1: every debit fits (initial 100 >= 25), so a refusal can only be a platform challenge.
    const operations = Array.from({ length: CONCURRENT_OPERATIONS }, (_, index) =>
      index % 2 === 0 ? { path: "/coins/topup", delta: 2 } : { path: "/coins/debit", delta: -1 },
    )
    const responses = await Promise.all(operations.map((op) => request("POST", op.path, { token: racerToken, body: { amount: Math.abs(op.delta) } })))
    let expected = initial
    let challenged = 0
    let unexpected = 0
    responses.forEach((res, index) => {
      if (res.status === 200) expected += operations[index].delta
      else if (isPlatformChallenge(res)) challenged += 1
      else unexpected += 1
    })
    const balance = await request("GET", "/coins/balance", { token: racerToken })
    const lost = balance.json?.amount !== expected
    if (lost) lostUpdate = true
    check(
      !lost && unexpected === 0,
      `10 ${CONCURRENT_OPERATIONS} concurrent mixed operations -> balance exactly ${expected} (${challenged} refused by the platform, not lost)`,
      `10 expected ${expected}, got ${balance.json?.amount}; unexpected statuses: ${unexpected}`,
    )

    const history = await request("GET", "/coins/transactions?limit=200", { token: racerToken })
    const txs = history.json?.transactions ?? []
    const sum = txs.reduce((total, tx) => total + (tx.direction === "credit" ? tx.amount : -tx.amount), 0)
    const newest = txs[0]
    check(
      sum === balance.json?.amount && newest?.resultingBalance === balance.json?.amount,
      "11 balance == sum of the returned history (and the newest entry's resultingBalance)",
      `11 history sums to ${sum}, balance is ${balance.json?.amount}`,
    )
    if (sum !== balance.json?.amount) lostUpdate = true
  }

  // 12. Idempotency
  {
    const owner = freshOwner()
    const ownerToken = await issueToken(owner)
    const key = `key-${Date.now()}`
    const headers = { "Idempotency-Key": key }
    const repeats = []
    for (let i = 0; i < 5; i += 1) repeats.push(await request("POST", "/coins/topup", { token: ownerToken, body: { amount: 10 }, headers }))
    const balance = await request("GET", "/coins/balance", { token: ownerToken })
    const history = await request("GET", "/coins/transactions", { token: ownerToken })
    const different = await request("POST", "/coins/topup", { token: ownerToken, body: { amount: 11 }, headers })
    const otherDirection = await request("POST", "/coins/debit", { token: ownerToken, body: { amount: 10 }, headers })
    const tooLong = await request("POST", "/coins/topup", { token: ownerToken, body: { amount: 1 }, headers: { "Idempotency-Key": "k".repeat(129) } })
    check(
      repeats.every((res) => res.status === 200 && res.json?.amount === 10) && balance.json?.amount === 10 && (history.json?.transactions ?? []).length === 1,
      "12 same Idempotency-Key x5 -> one effect, same answer",
      `12 balance ${balance.json?.amount}, ${(history.json?.transactions ?? []).length} ledger entries (expected 10 and 1)`,
    )
    check(
      different.status === 409 && different.json?.error?.code === "idempotency_key_conflict" && otherDirection.status === 409 && tooLong.status === 400,
      "12 same key with another amount or direction -> 409; key over 128 chars -> 400",
      `12 conflict=${different.status} direction=${otherDirection.status} tooLong=${tooLong.status}`,
    )
    if (balance.json?.amount !== 10) lostUpdate = true
  }

  // 14. Latency
  {
    const samples = []
    for (let i = 0; i < LATENCY_SAMPLES + 1; i += 1) {
      const started = performance.now()
      await request("GET", "/coins/balance", { token })
      samples.push(performance.now() - started)
    }
    const value = Math.round(p95(samples))
    check(value <= LATENCY_LIMIT_MS, `14 latency p95 ${value} ms (first call ${Math.round(samples[0])} ms) <= ${LATENCY_LIMIT_MS} ms`, `14 latency p95 ${value} ms exceeds ${LATENCY_LIMIT_MS} ms`)
  }

  // 15. Public documentation: the OpenAPI document lists every public route, and the Swagger UI page is served.
  {
    const openapi = await request("GET", "/openapi.json")
    const docs = await request("GET", "/docs")
    const paths = Object.keys(openapi.json?.paths ?? {})
    const required = ["/health", "/auth/token", "/coins/balance", "/coins/transactions", "/coins/topup", "/coins/debit"]
    const missing = required.filter((path) => !paths.includes(path))
    check(
      openapi.status === 200 && typeof openapi.json?.openapi === "string" && missing.length === 0 && docs.status === 200 && /<html/i.test(docs.text),
      `15 /openapi.json documents the ${required.length} public routes and /docs serves the Swagger UI`,
      `15 docs broken: openapi=${openapi.status} missing=[${missing.join(", ")}] docs=${docs.status}`,
    )
    if (!paths.some((path) => path.startsWith("/admin"))) console.log("- 15 note: the /admin/* routes are not in the OpenAPI document")
  }
}

console.log(`Verifying ${BASE_URL}${REPEAT > 1 ? ` (${REPEAT} runs)` : ""}`)
for (let run = 1; run <= REPEAT; run += 1) {
  if (REPEAT > 1) console.log(`\n--- run ${run}/${REPEAT} ---`)
  try {
    await runSuite()
  } catch (error) {
    fail(`run aborted: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (lostUpdate) {
    console.error("\nA lost update was detected; stopping.")
    break
  }
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
}
console.log("\nAll checks passed.")
