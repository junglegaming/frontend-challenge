// Generates deterministic placeholder SVGs for the mock catalog (see src/mocks/fixtures/nfts.ts).
// Real artwork is out of scope for this challenge; these are stable, reproducible stand-ins.
// Drawing logic lives in src/mocks/infra/placeholder-art.mjs, shared with the mocked AI image
// generator (admin console) so both produce byte-identical art from the same algorithm.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { avatar, tile } from '../src/mocks/infra/placeholder-art.mjs'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'art')
mkdirSync(OUT_DIR, { recursive: true })

const NFT_COUNT = 48
const VIEWS = 3
const ARTIST_COUNT = 8

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
