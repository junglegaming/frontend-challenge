// Deterministic placeholder-art drawing, shared by `scripts/generate-art.mjs` (build-time fixture
// generation) and the mocked AI image generator (runtime, admin-console feature) — exactly one
// implementation of the drawing logic, so both stay visually and behaviorally identical.
// Plain JS (not .ts) on purpose: `scripts/generate-art.mjs` runs under plain `node`, with no
// TypeScript loader, so both call sites need a module Node can import as-is.

// Small deterministic PRNG (mulberry32) so regenerating/regenerating-from-a-prompt is reproducible.
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

/** A 600x600 abstract tile SVG, fully determined by `seed` and `label`. */
export function tile(seed, label) {
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

/** A 96x96 circular avatar SVG, fully determined by `seed` and `initials`. */
export function avatar(seed, initials) {
  const rand = random(seed)
  const hue = HUES[Math.floor(rand() * HUES.length)]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <circle cx="48" cy="48" r="48" fill="hsl(${hue} 60% 35%)" />
  <text x="50%" y="56%" text-anchor="middle" font-family="system-ui, sans-serif" font-size="32" fill="white">${initials}</text>
</svg>`
}

/** FNV-1a hash of an arbitrary string, used to turn a free-text prompt into a stable numeric seed. */
export function fnv1a(value) {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}
