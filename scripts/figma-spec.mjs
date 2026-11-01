import { mkdir, readFile, writeFile } from 'node:fs/promises'

const file = JSON.parse(await readFile('design/file.json', 'utf8'))
const canvas = file.document.children[0]
const targetName = process.argv[2] ?? 'Desktop / Início'
const frame = canvas.children.find((c) => c.name === targetName)
if (!frame) throw new Error(`Frame não encontrado: ${targetName}`)

const toHex = (c) => {
  if (!c) return null
  const h = (n) =>
    Math.round(Math.max(0, Math.min(1, n)) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`.toUpperCase()
}
const solidFill = (fills) => {
  if (!Array.isArray(fills)) return null
  const f = fills.find((x) => x.visible !== false)
  if (!f) return null
  if (f.type === 'SOLID') return { color: toHex(f.color), opacity: f.opacity ?? 1 }
  if (f.type?.startsWith('GRADIENT')) return { type: f.type }
  if (f.type === 'IMAGE') return { type: 'IMAGE' }
  return { type: f.type }
}

const nodes = []
const walk = (node, parentBox, depth) => {
  const b = node.absoluteBoundingBox
  const entry = {
    depth,
    id: node.id,
    name: node.name,
    type: node.type,
    x: Math.round(b.x - parentBox.x),
    y: Math.round(b.y - parentBox.y),
    w: Math.round(b.width),
    h: Math.round(b.height),
  }
  if (node.cornerRadius != null) entry.radius = node.cornerRadius
  const fill = solidFill(node.fills)
  if (fill) entry.fill = fill
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    entry.layout = node.layoutMode
    entry.pad = [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft]
    entry.gap = node.itemSpacing
  }
  if (node.type === 'TEXT') {
    entry.text = node.characters
    entry.font = node.style?.fontFamily
    entry.size = node.style?.fontSize
    entry.weight = node.style?.fontWeight
    if (node.style?.lineHeightPx) entry.lh = Math.round(node.style.lineHeightPx * 100) / 100
    if (node.style?.letterSpacing) entry.ls = node.style.letterSpacing
    if (fill) entry.color = fill.color
  }
  nodes.push(entry)
  for (const child of node.children ?? []) walk(child, b, depth + 1)
}

walk(frame, frame.absoluteBoundingBox, 0)

await mkdir('specs', { recursive: true })
const slug = targetName
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .toLowerCase()
const outPath = `specs/${slug}.json`
await writeFile(
  outPath,
  JSON.stringify(
    {
      frame: {
        name: frame.name,
        width: Math.round(frame.absoluteBoundingBox.width),
        height: Math.round(frame.absoluteBoundingBox.height),
      },
      nodes,
    },
    null,
    2,
  ),
)

console.log(`Spec gerado: ${outPath}`)
console.log(
  `Nós: ${nodes.length} | Frame: ${Math.round(frame.absoluteBoundingBox.width)}x${Math.round(frame.absoluteBoundingBox.height)}`,
)
