// Standalone verification for the coins backend — run against an already-running `pnpm dev`
// instance (not part of the project's Playwright/e2e suite; see README.md).
// Usage: node scripts/smoke-test.mjs [baseUrl]

const BASE_URL = process.argv[2] ?? 'http://localhost:4000'
const USER_ID = `smoke_${Date.now().toString(36)}`

let failures = 0

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    failures += 1
    console.error(`✘ ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  } else {
    console.log(`✓ ${label}`)
  }
}

async function call(method, path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-User-Id': USER_ID },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: response.status, body: await response.json() }
}

async function main() {
  console.log(`Running smoke test against ${BASE_URL} as ${USER_ID}`)

  const initial = await call('GET', '/coins/balance')
  assertEqual(initial.body.balance, 0, 'fresh user starts with balance 0')

  const topup1 = await call('POST', '/coins/topup', { amount: 500 })
  assertEqual(topup1.status, 201, 'topup 500 returns 201')
  assertEqual(topup1.body.balance, 500, 'balance after first topup is 500')

  const topup2 = await call('POST', '/coins/topup', { amount: 250 })
  assertEqual(topup2.body.balance, 750, 'balance accumulates across topups (750)')

  const afterTopups = await call('GET', '/coins/balance')
  assertEqual(afterTopups.body.balance, 750, 'GET /coins/balance reflects accumulated topups')

  const invalidTopup = await call('POST', '/coins/topup', { amount: -5 })
  assertEqual(invalidTopup.status, 400, 'negative topup amount is rejected with 400')

  const debitInsufficient = await call('POST', '/coins/debit', { amount: 1000, orderRef: 'order_a' })
  assertEqual(debitInsufficient.status, 409, 'debit larger than balance returns 409')
  assertEqual(debitInsufficient.body.error, 'insufficient_balance', 'debit rejection has the right error code')
  const afterFailedDebit = await call('GET', '/coins/balance')
  assertEqual(afterFailedDebit.body.balance, 750, 'balance unchanged after a rejected debit')

  const debitExact = await call('POST', '/coins/debit', { amount: 750, orderRef: 'order_b' })
  assertEqual(debitExact.status, 200, 'debit exactly equal to balance succeeds (not "insufficient")')
  assertEqual(debitExact.body.balance, 0, 'balance after exact debit is 0')

  const refund = await call('POST', '/coins/refund', { amount: 750, orderRef: 'order_b' })
  assertEqual(refund.body.balance, 750, 'refund returns the balance to its pre-debit value')

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`)
    process.exit(1)
  }
  console.log('\nAll checks passed.')
}

main().catch((error) => {
  console.error('Smoke test crashed:', error)
  process.exit(1)
})
