// Fails when a literal color (hex, rgb(), hsl(), oklch(), Tailwind arbitrary color class) appears outside the
// design-token block in src/index.css. See specs/001-design-system-standards/contracts/design-tokens.md.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../src', import.meta.url))
const SKIP_DIRS = new Set(['mocks'])
const SKIP_FILES = new Set(['index.css', 'routeTree.gen.ts'])
const EXTENSIONS = /\.(tsx?|css)$/

const PATTERNS = [
  { name: 'hex color', regex: /#[0-9a-fA-F]{3,8}\b(?![\w-]*\()/g },
  { name: 'functional color', regex: /\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/g },
  { name: 'arbitrary color class', regex: /\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|shadow)-\[(?:#|rgb|hsl|oklch)/g },
]

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) yield* walk(path)
    } else if (EXTENSIONS.test(entry) && !SKIP_FILES.has(entry)) {
      yield path
    }
  }
}

const findings = []
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, index) => {
    for (const { name, regex } of PATTERNS) {
      regex.lastIndex = 0
      // Comment-only lines (URLs, issue ids) are not styling.
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue
      if (regex.test(line)) findings.push(`${relative(ROOT, file)}:${index + 1}  ${name}: ${line.trim()}`)
    }
  })
}

if (findings.length > 0) {
  console.error('Literal colors found outside src/index.css (use a design token instead):\n')
  console.error(findings.join('\n'))
  process.exit(1)
}
console.log('check-tokens: no literal colors outside src/index.css')
