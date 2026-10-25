import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const sources = [
  [
    "golden-signal",
    "golden-signal-160.png",
    "f20b58b99de12b6eceede2090607e4b999275bba95de7674bb14f26b59666b21",
  ],
  [
    "sage-nomad",
    "sage-nomad-009.png",
    "9b25d8d72395aa62f919f6ad33b95b7ba7bbfee6049e95cf159a319b03ecb8d9",
  ],
  [
    "violet-nomad",
    "violet-nomad-314.png",
    "2a42ba5adc341c3d0e1ad6905058e2762d995fc988113a7cd28b0d15f6a4ba28",
  ],
  [
    "golden-frequency",
    "golden-frequency-071.png",
    "326df4c1c08c31c88b9f407e51be3991e46667183af62aa1501927adc76f52b5",
  ],
];
await mkdir("assets/source", { recursive: true });
await mkdir("public/art", { recursive: true });
for (const [name, file, checksum] of sources) {
  const path = `assets/source/${name}.png`;
  let source;
  try {
    source = await readFile(path);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const response = await fetch(
      `https://raw.githubusercontent.com/theviniis/frontend-challenge/main/public/assets/nft/${file}`,
    );
    if (!response.ok)
      throw new Error(`Falha ao baixar ${file}: HTTP ${response.status}`);
    source = Buffer.from(await response.arrayBuffer());
  }
  if (createHash("sha256").update(source).digest("hex") !== checksum)
    throw new Error(`Checksum inválido: ${file}`);
  await writeFile(path, source);
  await sharp(`assets/source/${name}.png`)
    .resize(720, 720)
    .webp({ quality: 86 })
    .toFile(`public/art/${name}.webp`);
}
