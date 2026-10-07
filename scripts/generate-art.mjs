// Generates deterministic placeholder SVGs for the mock catalog (see src/mocks/fixtures/nfts.ts).
// Real artwork is out of scope for this challenge; these are stable, reproducible stand-ins.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'art')
mkdirSync(OUT_DIR, { recursive: true })

const NFT_COUNT = 48
const VIEWS = 3
const ARTIST_COUNT = 8

// Small deterministic PRNG (mulberry32) so regenerating the script produces identical files.
function random(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const HUES = [265, 280, 200, 150, 20, 340, 45, 180]

function tile(seed, label) {
  const rand = random(seed)
  const hue = HUES[Math.floor(rand() * HUES.length)]
  const hue2 = (hue + 40 + Math.floor(rand() * 60)) % 360
  const cx = Math.round(rand() * 600)
  const cy = Math.round(rand() * 600)
  const r = Math.round(120 + rand() * 180)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 70% 22%)" />
      <stop offset="100%" stop-color="hsl(${hue2} 65% 14%)" />
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#g)" />
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="hsl(${hue} 80% 55% / 0.25)" />
  <text x="50%" y="52%" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" fill="white" opacity="0.85">${label}</text>
</svg>`
}

function avatar(seed, initials) {
  const rand = random(seed)
  const hue = HUES[Math.floor(rand() * HUES.length)]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <circle cx="48" cy="48" r="48" fill="hsl(${hue} 60% 35%)" />
  <text x="50%" y="56%" text-anchor="middle" font-family="system-ui, sans-serif" font-size="32" fill="white">${initials}</text>
</svg>`
}

for (let n = 1; n <= NFT_COUNT; n++) {
  const id = String(n).padStart(3, '0')
  for (let view = 1; view <= VIEWS; view++) {
    writeFileSync(join(OUT_DIR, `nft-${id}-${view}.svg`), tile(n * 1000 + view, `#${id}`))
  }
}

for (let a = 1; a <= ARTIST_COUNT; a++) {
  writeFileSync(join(OUT_DIR, `artist-${a}.svg`), avatar(90_000 + a, `A${a}`))
}

writeFileSync(join(OUT_DIR, 'avatar-ana.svg'), avatar(1, 'AS'))

console.log(`Generated ${NFT_COUNT * VIEWS} NFT images, ${ARTIST_COUNT} artist avatars and 1 user avatar in ${OUT_DIR}`)
