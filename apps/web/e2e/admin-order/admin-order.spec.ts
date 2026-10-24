import { expect, test, type Page } from '@playwright/test'
import {
  apiGet,
  hasNoHorizontalScroll,
  pickAvailableEditions,
  promoteCurrentUserToAdmin,
  runAxe,
  seedBuyerOrders,
  SESSION_KEY,
  signIn,
  VIEWPORTS,
} from '../design-system/helpers'

// specs/013-marketplace-admin, US2: the administrator opens one order of any user, read-only, with the same content as
// the buyer's receipt. Everything is simulated (MSW).

interface Seeded {
  confirmed: string
  declined: string
  pending: string
  ownerToken: string
}

const token = (page: Page) => page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)
const setToken = (page: Page, value: string) => page.evaluate(([key, v]) => localStorage.setItem(key, v), [SESSION_KEY, value] as const)

/** One order per status, each from a different buyer; leaves the last buyer signed in as admin. */
async function seed(page: Page): Promise<Seeded> {
  await signIn(page)
  const editions = await pickAvailableEditions(page, 3)
  const [confirmed] = await seedBuyerOrders(page, 'confirmed', [editions[0]!])
  const ownerToken = (await token(page))!
  const [declined] = await seedBuyerOrders(page, 'declined', [editions[1]!])
  const [pending] = await seedBuyerOrders(page, 'pending', [editions[2]!])
  await promoteCurrentUserToAdmin(page)
  return { confirmed: confirmed!, declined: declined!, pending: pending!, ownerToken }
}

/** Items (name + line total), fee and total as shown by either the receipt or the admin detail. */
async function readAmounts(page: Page) {
  return page.evaluate(() => {
    const main = document.querySelector('main')!
    const items = Array.from(main.querySelectorAll('li'))
      .filter((li) => li.querySelector('img'))
      .map((li) => {
        const texts = Array.from(li.querySelectorAll('p')).map((p) => p.textContent?.trim() ?? '')
        return { name: texts[0] ?? '', lineTotal: texts[texts.length - 1] ?? '' }
      })
    const amount = (label: string) => {
      const dts = Array.from(main.querySelectorAll('dt')).filter((dt) => dt.textContent?.trim() === label)
      return dts[dts.length - 1]?.nextElementSibling?.textContent?.trim() ?? null
    }
    return { items, networkFee: amount('Taxa de rede'), total: amount('Total') }
  })
}

const orderHeading = (page: Page) => page.getByRole('heading', { name: 'Pedido', level: 1 })

test('the detail of a confirmed order shows buyer, items, wallet, network, totals and transaction', async ({ page }) => {
  const seeded = await seed(page)
  const detail = await apiGet<{ userId: string; lines: { name: string; editionName: string; quantity: number }[]; transaction: { hash: string } }>(
    page,
    `/admin/orders/${seeded.confirmed}`,
  )
  await page.goto(`/admin/orders/${seeded.confirmed}`)
  await expect(orderHeading(page)).toBeVisible()

  const main = page.getByRole('main')
  await expect(main.getByText(seeded.confirmed)).toBeVisible()
  await expect(main.getByText('Confirmado')).toBeVisible()
  await expect(main.getByText('Teste E2E')).toBeVisible()
  await expect(main.getByText('teste@nft.dev')).toBeVisible()
  await expect(main.getByText(`Usuário ${detail.userId}`)).toBeVisible()
  await expect(main.getByText('Carteira de teste')).toBeVisible()
  await expect(main.getByText(/^ethereum$/i)).toBeVisible()
  await expect(main.getByText(detail.lines[0]!.name)).toBeVisible()
  await expect(main.getByText(new RegExp(`${detail.lines[0]!.editionName} \\(x ${detail.lines[0]!.quantity}\\)`))).toBeVisible()
  for (const label of ['Subtotal', 'Desconto', 'Taxa de rede', 'Total']) await expect(main.getByText(label, { exact: true })).toBeVisible()
  await expect(main.getByRole('link', { name: new RegExp(detail.transaction.hash) })).toHaveAttribute('href', /.+/)
})

test('the items and amounts are identical to the receipt the buyer sees', async ({ page }) => {
  const seeded = await seed(page)

  await page.goto(`/admin/orders/${seeded.confirmed}`)
  await expect(orderHeading(page)).toBeVisible()
  await expect(page.getByRole('main').getByText('Confirmado')).toBeVisible()
  const admin = await readAmounts(page)
  expect(admin.items.length).toBeGreaterThan(0)

  // The same order as its owner sees it.
  const adminToken = (await token(page))!
  await setToken(page, seeded.ownerToken)
  await page.goto(`/orders/${seeded.confirmed}`)
  await expect(page.getByRole('heading', { name: 'Detalhes da transação' })).toBeVisible()
  const receipt = await readAmounts(page)

  expect(admin.items).toEqual(receipt.items)
  expect(admin.networkFee).toBe(receipt.networkFee)
  expect(admin.total).toBe(receipt.total)
  await setToken(page, adminToken)
})

test('a declined order shows its reason and a pending one shows "Pendente"', async ({ page }) => {
  const seeded = await seed(page)

  await page.goto(`/admin/orders/${seeded.declined}`)
  await expect(orderHeading(page)).toBeVisible()
  await expect(page.getByRole('main').getByText('Recusado', { exact: true })).toBeVisible()
  await expect(page.getByRole('main').getByText('Motivo da recusa')).toBeVisible()
  await expect(page.getByRole('main').getByText(/Pagamento recusado/)).toBeVisible()

  await page.goto(`/admin/orders/${seeded.pending}`)
  await expect(orderHeading(page)).toBeVisible()
  await expect(page.getByRole('main').getByText('Pendente')).toBeVisible()
  await expect(page.getByRole('main').getByText('Motivo da recusa')).toHaveCount(0)
})

test('an unknown or malformed order id shows "Pedido não encontrado." and a way back to the list', async ({ page }) => {
  await signIn(page)
  await promoteCurrentUserToAdmin(page)

  for (const id of ['inexistente', '%20', 'x'.repeat(200)]) {
    await page.goto(`/admin/orders/${id}`)
    await expect(page.getByRole('main').getByRole('alert')).toHaveText('Pedido não encontrado.', { timeout: 15_000 })
    await page.getByRole('main').getByRole('link', { name: 'Voltar para a lista' }).click()
    await expect(page).toHaveURL(/\/admin\/orders$/)
    await expect(page.getByRole('heading', { name: 'Pedidos', level: 1 })).toBeVisible()
  }
})

test('a collector is sent home and a visitor to sign-in; the owner still sees only their own order', async ({ page }) => {
  const seeded = await seed(page)
  const adminToken = (await token(page))!

  // A collector who does not own the order: refused on the screen and by the buyer's own endpoint.
  await signIn(page)
  const otherToken = (await token(page))!
  await page.goto(`/admin/orders/${seeded.confirmed}`)
  await expect(page).toHaveURL(/\/\?forbidden=true$/)
  const status = await page.evaluate(
    async ([id, key]) => (await fetch(`/api/orders/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem(key)}` } })).status,
    [seeded.confirmed, SESSION_KEY] as const,
  )
  expect(status).toBe(403)
  expect(otherToken).not.toBe(adminToken)

  // The owner reads their own order through the buyer's endpoint, as always.
  await setToken(page, seeded.ownerToken)
  const ownStatus = await page.evaluate(
    async ([id, key]) => (await fetch(`/api/orders/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem(key)}` } })).status,
    [seeded.confirmed, SESSION_KEY] as const,
  )
  expect(ownStatus).toBe(200)

  await page.evaluate((key) => localStorage.removeItem(key), SESSION_KEY)
  await page.goto(`/admin/orders/${seeded.confirmed}`)
  await expect(page).toHaveURL(/\/login\?redirect=/)
})

test('the detail offers no action that changes the order', async ({ page }) => {
  const seeded = await seed(page)
  await page.goto(`/admin/orders/${seeded.pending}`)
  await expect(orderHeading(page)).toBeVisible()
  await expect(page.getByRole('main').getByText('Pendente')).toBeVisible()

  const buttons = await page.getByRole('main').getByRole('button').allInnerTexts()
  expect(buttons.map((name) => name.trim())).toEqual(['Sair do site'])
  await expect(page.getByRole('main').locator('form, input, select, textarea')).toHaveCount(0)
})

test('the detail has no critical accessibility violations', async ({ page }) => {
  const seeded = await seed(page)
  await page.goto(`/admin/orders/${seeded.confirmed}`)
  await expect(page.getByRole('main').getByText('Confirmado')).toBeVisible()
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    // Frozen clock and UTC keep the page deterministic; the random ids and the transaction hash are masked.
    test.use({ viewport, timezoneId: 'UTC', locale: 'pt-BR' })

    test('the detail renders without horizontal scroll and matches its baseline', async ({ page }) => {
      const at = new Date('2026-01-15T12:00:00Z')
      await page.clock.setFixedTime(at)
      await signIn(page)
      const [edition] = await pickAvailableEditions(page, 1)
      const [orderId] = await seedBuyerOrders(page, 'confirmed', [edition!], at)
      await promoteCurrentUserToAdmin(page)
      await page.goto(`/admin/orders/${orderId}`)
      await expect(page.getByRole('main').getByText('Confirmado')).toBeVisible()
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      const main = page.getByRole('main')
      await expect(page).toHaveScreenshot(`admin-order-${viewport.width}.png`, {
        fullPage: true,
        mask: [main.locator('p.break-all'), main.getByText(/^Usuário usr_/), main.getByRole('link', { name: /^0x/ })],
      })
    })
  })
}
