#!/usr/bin/env node
// Verifies the admin routes of a running apps/api. The admin must already exist (pnpm seed:admin).
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... BASE_URL=http://localhost:4001/api node scripts/admin-smoke-test.mjs
// Credentials are read from the environment only.

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4001/api"
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD.")
  process.exit(1)
}

let failures = 0
const ok = (m) => console.log(`✓ ${m}`)
const fail = (m) => {
  failures += 1
  console.error(`✗ ${m}`)
}
const check = (cond, pass, failMsg) => (cond ? ok(pass) : fail(failMsg))

async function request(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    // non-JSON body
  }
  return { status: res.status, json, text }
}

// 1. Login
const login = await request("POST", "/admin/login", { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
check(login.status === 200 && typeof login.json?.token === "string", "admin login -> 200 with a token", `login failed: ${login.status} ${login.text}`)
if (login.status !== 200) process.exit(1)
const adminToken = login.json.token
check(!login.text.includes("passwordHash") && !login.text.includes("scrypt$"), "login response never contains the hash", "login response leaked the hash")

// 2. Bad credentials are indistinguishable
const wrongPassword = await request("POST", "/admin/login", { body: { email: ADMIN_EMAIL, password: `${ADMIN_PASSWORD}x` } })
const unknownEmail = await request("POST", "/admin/login", { body: { email: "nobody@example.com", password: ADMIN_PASSWORD } })
check(wrongPassword.status === 401 && unknownEmail.status === 401, "wrong password and unknown e-mail -> 401", `expected 401/401, got ${wrongPassword.status}/${unknownEmail.status}`)
check(wrongPassword.text === unknownEmail.text, "both failures return the identical body", "failure bodies differ (account enumeration)")
const malformed = await request("POST", "/admin/login", { body: { email: "not-an-email", password: "x" } })
check(malformed.status === 400, "malformed login body -> 400", `expected 400, got ${malformed.status}`)

// 3. Guards
check((await request("GET", "/admin/me")).status === 401, "GET /admin/me without token -> 401", "admin route reachable without token")
const me = await request("GET", "/admin/me", { token: adminToken })
check(me.status === 200 && me.json?.role === "admin", "GET /admin/me with admin token -> 200", `me failed: ${me.status}`)

const ownerToken = (await request("POST", "/auth/token", { body: { ownerId: `smoke-${Date.now()}` } })).json?.token
const asOwner = await request("GET", "/admin/me", { token: ownerToken })
check(asOwner.status === 403, "owner token on an admin route -> 403", `expected 403, got ${asOwner.status}`)
const adminOnOwnerRoute = await request("GET", "/coins/balance", { token: adminToken })
check(adminOnOwnerRoute.status === 403, "admin token on an owner route -> 403", `expected 403, got ${adminOnOwnerRoute.status}`)

// 4. Data routes
const owners = await request("GET", "/admin/owners?limit=5", { token: adminToken })
check(owners.status === 200 && Array.isArray(owners.json?.owners), "GET /admin/owners -> 200 with a list", `owners failed: ${owners.status} ${owners.text}`)
check((await request("GET", "/admin/owners?limit=0", { token: adminToken })).status === 400, "limit=0 -> 400", "invalid limit accepted")

const firstOwner = owners.json?.owners?.[0]?.ownerId
if (firstOwner) {
  const detail = await request("GET", `/admin/owners/${encodeURIComponent(firstOwner)}`, { token: adminToken })
  check(detail.status === 200 && detail.json?.balance?.ownerId === firstOwner, `GET /admin/owners/${firstOwner} -> 200`, `detail failed: ${detail.status} ${detail.text}`)
}
const traversal = await request("GET", "/admin/owners/a%2Fb", { token: adminToken })
check(traversal.status === 400, "ownerId containing '/' -> 400", `expected 400, got ${traversal.status}`)

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
}
console.log("\nAll admin smoke-test checks passed.")
