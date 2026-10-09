import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { unzipSync } from 'fflate';
import { loadEnv } from 'vite';

const root = path.resolve(import.meta.dirname, '..');
const env = { ...loadEnv('development', root, ''), ...process.env };
const fileKey = env.FIGMA_FILE_KEY || 'Ff0SksUi7UFtPWUO8kyNtw';
const output = path.join(root, 'docs/figma');
const nftDir = path.join(root, 'public/assets/nft');
const iconsDir = path.join(root, 'public/icons');
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const hash = (data: Uint8Array) =>
  createHash('sha256').update(data).digest('hex');

// Fixed archive hashes preserve fixture URLs and avoid ZIP ordering dependence.
const names: Record<string, string> = {
  '8459204731e6eba9d474cbc8ebc37071360d3ba5': 'golden-signal-160',
  '2986a7cb16d09de8970824d2dd58bf0bb021702c': 'sage-nomad-009',
  '9df2ff42dd27ba657621c304557d1a855a4be6a5': 'golden-frequency-071',
  '87580f2def9af0ce13f4b6f6ce17bb2449bcfc16': 'violet-nomad-314',
};
const archive = unzipSync(
  await readFile(path.join(root, 'Frontend Challenge.fig'))
);
await mkdir(output, { recursive: true });
await mkdir(nftDir, { recursive: true });
const images = [];
for (const [source, name] of Object.entries(names)) {
  const bytes = archive[`images/${source}`];
  if (!bytes) throw new Error(`PNG ausente no .fig: ${source}`);
  const png = Buffer.from(bytes);
  if (
    png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
    png.readUInt32BE(16) !== 1254 ||
    png.readUInt32BE(20) !== 1254
  )
    throw new Error(`PNG inválido ou dimensões diferentes de 1254²: ${source}`);
  await writeFile(path.join(nftDir, `${name}.png`), bytes);
  images.push({
    source: `images/${source}`,
    path: `public/assets/nft/${name}.png`,
    width: 1254,
    height: 1254,
    sha256: hash(bytes),
  });
}
await writeFile(
  path.join(output, 'local-assets.json'),
  json({ source: 'Frontend Challenge.fig', images })
);
console.log('4 PNGs locais extraídos (1254 × 1254).');
if (!env.FIGMA_TOKEN)
  throw new Error(
    'PNGs extraídos; defina FIGMA_TOKEN em .env.local para exportar JSON e Iconly.'
  );

async function api(endpoint: string) {
  const response = await fetch(`https://api.figma.com/v1/${endpoint}`, {
    headers: { 'X-Figma-Token': env.FIGMA_TOKEN! },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok)
    throw new Error(
      `Figma HTTP ${response.status} (${endpoint.split('?')[0]}).`
    );
  return response.json();
}
type FigmaNode = {
  id: string;
  name: string;
  componentId?: string;
  children?: FigmaNode[];
};
type FigmaFile = {
  document: FigmaNode;
  version: string;
  components: Record<string, { name: string }>;
};
const file = (await api(
  `files/${fileKey}${env.FIGMA_VERSION ? `?version=${encodeURIComponent(env.FIGMA_VERSION)}` : ''}`
)) as FigmaFile;
const icons = new Map<string, FigmaNode>();
function visit(node: FigmaNode) {
  const componentName = node.componentId
    ? file.components[node.componentId]?.name
    : '';
  if (/iconly/i.test(node.name) || /iconly/i.test(componentName || '')) {
    icons.set(node.name, node);
    return; // Export the icon root, never its internal paths separately.
  }
  node.children?.forEach(visit);
}
visit(file.document);
if (!icons.size) throw new Error('Nenhum nó Iconly encontrado no Figma.');
await mkdir(iconsDir, { recursive: true });
const manifest = [];
const nodes = [...icons.values()].sort((a, b) =>
  a.name.localeCompare(b.name, 'en')
);
for (let start = 0; start < nodes.length; start += 50) {
  const batch = nodes.slice(start, start + 50);
  const params = new URLSearchParams({
    ids: batch.map((n) => n.id).join(','),
    format: 'svg',
    version: file.version,
  });
  const result = (await api(`images/${fileKey}?${params}`)) as {
    images: Record<string, string | null>;
  };
  for (const node of batch) {
    const url = result.images[node.id];
    if (!url) throw new Error(`Exportação SVG falhou: ${node.id}`);
    const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok)
      throw new Error(`Download SVG HTTP ${response.status}: ${node.id}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!Buffer.from(bytes).toString().includes('<svg'))
      throw new Error(`SVG inválido: ${node.id}`);
    const name = `${node.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}-${node.id.replaceAll(':', '-')}.svg`;
    await writeFile(path.join(iconsDir, name), bytes);
    manifest.push({
      id: node.id,
      name: node.name,
      path: `public/icons/${name}`,
      sha256: hash(bytes),
    });
  }
}
// Do not persist expiring export URLs or timestamps in the asset manifest.
await writeFile(path.join(output, 'file.json'), json(file));
await writeFile(
  path.join(output, 'icons.json'),
  json({ fileKey, version: file.version, icons: manifest })
);
console.log(
  `${manifest.length} ícones exportados; referência salva em docs/figma/file.json.`
);
