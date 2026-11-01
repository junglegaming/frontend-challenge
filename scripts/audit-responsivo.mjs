// Auditoria responsiva: screenshots de página inteira + métricas de overflow
// por rota × viewport. Requer `npm run dev` ativo (ou BASE_URL apontando para
// um preview). Mede, não aprova: o resultado alimenta a inspeção visual humana.
//
// Uso: node scripts/audit-responsivo.mjs <pastaSaida> [rota1,rota2]
// Ex.: node scripts/audit-responsivo.mjs reports/responsivo inicio,carrinho
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
const OUT = process.argv[2] ?? 'reports/responsivo'
const ONLY = process.argv[3] ? process.argv[3].split(',') : null
fs.mkdirSync(OUT, { recursive: true })

const VIEWPORTS = [
  [320, 640],
  [360, 740],
  [375, 667],
  [414, 896],
  [600, 900],
  [768, 1024],
  [900, 1000],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
]

const browser = await chromium.launch()

async function setupState() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/login')
  await page.getByLabel('E-mail').fill('nova@kurio.test')
  await page.getByLabel('Senha').fill('kurio123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.getByText('Nova Sato').first().waitFor({ timeout: 15000 })
  await page.goto(BASE + '/')
  await page
    .getByRole('link', { name: /Emerald Ape/i })
    .first()
    .click()
  await page.getByRole('button', { name: 'Comprar' }).click()
  await page.waitForURL(/\/carrinho/)
  await page.getByRole('link', { name: 'Finalizar compra' }).click()
  await page.waitForURL(/\/pagamento/)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await page.waitForURL(/\/pedido\//, { timeout: 15000 })
  const orderPath = new URL(page.url()).pathname
  await page.getByText('Compra confirmada').waitFor({ timeout: 20000 })
  // Dois itens no carrinho para as telas de carrinho/pagamento.
  for (const nft of ['nft-2', 'nft-3']) {
    await page.goto(BASE + '/nft/' + nft)
    await page.getByRole('heading', { level: 1 }).waitFor()
    const add = page.getByRole('button', { name: /Adicionar ao carrinho/i })
    if (await add.count()) await add.first().click()
    else await page.getByRole('button', { name: 'Comprar' }).click()
    await page.waitForTimeout(600)
  }
  const state = await ctx.storageState()
  await ctx.close()
  return { state, orderPath }
}

const { state, orderPath } = await setupState()

const ROUTES = [
  { name: 'inicio', path: '/', auth: true },
  { name: 'detalhe', path: '/nft/nft-1', auth: true },
  { name: 'carrinho', path: '/carrinho', auth: true },
  { name: 'pagamento', path: '/pagamento', auth: true },
  { name: 'pedido', path: orderPath, auth: true },
  { name: 'perfil', path: '/perfil', auth: true },
  { name: 'carteiras', path: '/carteiras', auth: true },
  { name: 'login', path: '/login', auth: false },
  { name: 'cadastro', path: '/cadastro', auth: false },
].filter((r) => !ONLY || ONLY.includes(r.name))

const report = []
for (const route of ROUTES) {
  for (const [w, h] of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      storageState: route.auth ? state : undefined,
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(BASE + route.path)
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(900)
    const metrics = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth
      const docW = document.documentElement.scrollWidth
      const clipped = (el) => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const s = getComputedStyle(p)
          if (/(hidden|auto|scroll|clip)/.test(s.overflowX)) {
            const r = p.getBoundingClientRect()
            if (r.right <= vw + 1 && r.left >= -1) return true
          }
        }
        return false
      }
      const describe = (el) => {
        const cls = (el.getAttribute('class') || '').split(/\s+/).slice(0, 6).join('.')
        const txt = (el.textContent || '').trim().slice(0, 40)
        return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''} "${txt}"`
      }
      const offenders = []
      for (const el of document.body.querySelectorAll('*')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        const s = getComputedStyle(el)
        if (s.visibility === 'hidden' || s.position === 'fixed') continue
        if (el.closest('.sr-only, [aria-hidden="true"]')) continue
        if (r.right > vw + 1 || r.left < -1) {
          if (clipped(el)) continue
          offenders.push({ el: describe(el), left: Math.round(r.left), right: Math.round(r.right) })
        }
      }
      // Texto que estoura a própria caixa. Falso positivo conhecido: o badge
      // absoluto do carrinho no Header soma ao scrollWidth do link.
      const textOverflow = []
      for (const el of document.body.querySelectorAll(
        'h1,h2,h3,p,span,a,button,td,th,dd,dt,label',
      )) {
        if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
          const s = getComputedStyle(el)
          if (s.textOverflow === 'ellipsis' || s.overflow !== 'visible') continue
          if (el.closest('.sr-only')) continue
          textOverflow.push(describe(el) + ` sw=${el.scrollWidth} cw=${el.clientWidth}`)
        }
      }
      return {
        vw,
        docW,
        hOverflow: docW > vw,
        docH: document.documentElement.scrollHeight,
        offenders: offenders.slice(0, 8),
        offenderCount: offenders.length,
        textOverflow: textOverflow.slice(0, 6),
      }
    })
    const file = path.join(OUT, `${route.name}-${w}.png`)
    await page.screenshot({ path: file, fullPage: true })
    report.push({ route: route.name, w, h, errors, ...metrics })
    await ctx.close()
  }
}
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ orderPath, report }, null, 2))
for (const r of report) {
  const flag = r.hOverflow || r.offenderCount || r.textOverflow.length || r.errors.length
  console.log(
    `${flag ? '✗' : '✓'} ${r.route.padEnd(10)} ${String(r.w).padStart(4)}  docW=${r.docW} off=${r.offenderCount} txt=${r.textOverflow.length} err=${r.errors.length}`,
  )
  if (flag) {
    for (const o of r.offenders.slice(0, 4)) console.log(`     ↳ ${o.el} [${o.left},${o.right}]`)
    for (const t of r.textOverflow.slice(0, 3)) console.log(`     ⇢ ${t}`)
    for (const e of r.errors.slice(0, 2)) console.log(`     ! ${e.slice(0, 160)}`)
  }
}
await browser.close()
