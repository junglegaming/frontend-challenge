export function artworkSources(image: string): string | undefined {
  if (!/^\/assets\/ape-[1-4]\.webp$/.test(image)) return undefined;
  const base = image.slice(0, -5);
  return `${base}-320.webp 320w, ${image} 640w, ${base}-960.webp 960w`;
}
