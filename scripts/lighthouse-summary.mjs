// Resume as auditorias do LHCI: mediana de 3 execuções por página e perfil,
// métricas (LCP, CLS, TBT), versões e ambiente. Mantém só a execução
// representativa de cada página (HTML + JSON) para não inflar o repositório.
//
// Uso: node scripts/lighthouse-summary.mjs  (depois de `lhci autorun`)
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const ROOT = 'lighthouse'
const PROFILES = ['mobile', 'desktop']
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const METRICS = {
  LCP: 'largest-contentful-paint',
  CLS: 'cumulative-layout-shift',
  TBT: 'total-blocking-time',
  FCP: 'first-contentful-paint',
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

const summary = { generatedAt: new Date().toISOString(), environment: {}, results: [] }

for (const profile of PROFILES) {
  const dir = path.join(ROOT, profile)
  const manifestPath = path.join(dir, 'manifest.json')
  if (!fs.existsSync(manifestPath)) continue
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const byUrl = new Map()
  for (const entry of manifest) {
    const lhr = JSON.parse(fs.readFileSync(entry.jsonPath, 'utf8'))
    summary.environment = {
      lighthouse: lhr.lighthouseVersion,
      userAgent: lhr.environment?.hostUserAgent,
      benchmarkIndex: lhr.environment?.benchmarkIndex,
      node: process.version,
      os: `${os.type()} ${os.release()}`,
    }
    const runs = byUrl.get(entry.url) ?? []
    runs.push({ entry, lhr })
    byUrl.set(entry.url, runs)
  }
  for (const [url, runs] of byUrl) {
    const result = {
      profile,
      url: new URL(url).pathname,
      runs: runs.length,
      scores: {},
      metrics: {},
    }
    for (const category of CATEGORIES) {
      result.scores[category] = Math.round(
        median(runs.map(({ lhr }) => lhr.categories[category]?.score ?? 0)) * 100,
      )
    }
    for (const [label, id] of Object.entries(METRICS)) {
      const value = median(runs.map(({ lhr }) => lhr.audits[id]?.numericValue ?? 0))
      result.metrics[label] = label === 'CLS' ? Number(value.toFixed(3)) : Math.round(value)
    }
    result.settings = {
      formFactor: runs[0].lhr.configSettings.formFactor,
      throttling: runs[0].lhr.configSettings.throttling,
    }
    summary.results.push(result)
  }
  // Remove execuções não representativas (mantém 1 HTML + 1 JSON por página).
  for (const entry of manifest) {
    if (entry.isRepresentativeRun) continue
    for (const file of [entry.jsonPath, entry.htmlPath])
      if (fs.existsSync(file)) fs.unlinkSync(file)
  }
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      manifest.filter((entry) => entry.isRepresentativeRun),
      null,
      2,
    ),
  )
}

fs.writeFileSync(path.join(ROOT, 'summary.json'), JSON.stringify(summary, null, 2))
console.log('perfil   página        perf  a11y  bp   seo   LCP(ms) CLS    TBT(ms)')
for (const r of summary.results) {
  const s = r.scores
  console.log(
    `${r.profile.padEnd(8)} ${r.url.padEnd(13)} ${String(s.performance).padStart(4)}  ${String(s.accessibility).padStart(4)}  ${String(s['best-practices']).padStart(3)}  ${String(s.seo).padStart(4)}  ${String(r.metrics.LCP).padStart(7)} ${String(r.metrics.CLS).padStart(5)} ${String(r.metrics.TBT).padStart(8)}`,
  )
}
