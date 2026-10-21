import { Button } from '@/shared/ui/button'

export function HeroBanner() {
  return (
    <section
      aria-labelledby="hero-title"
      className="grid gap-8 overflow-hidden rounded-lg bg-card p-8 md:grid-cols-2 md:items-center md:p-12"
    >
      <div className="flex flex-col gap-4">
        <p className="text-body text-muted-foreground">Bem-vindo à Kurio</p>
        <h1 id="hero-title" className="text-title font-bold uppercase leading-tight tracking-wide md:text-2xl">
          Seja dono do futuro da arte digital
        </h1>
        <p className="max-w-md text-muted-foreground">
          Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie
          artistas e tenha uma parte da cultura da internet.
        </p>
        <Button asChild size="lg" className="w-fit">
          <a href="#catalogo">Explorar</a>
        </Button>
      </div>
      <img
        src="/art/nft-001-1.svg"
        alt="Destaque do catálogo Kurio"
        width={600}
        height={600}
        className="mx-auto aspect-square w-full max-w-sm rounded-lg object-cover"
      />
    </section>
  )
}
