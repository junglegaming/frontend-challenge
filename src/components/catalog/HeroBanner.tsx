import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { nftImageProps } from '@/lib/images'
import { scrollToCatalog } from './scrollToCatalog'

export function HeroBanner() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden rounded-3xl bg-card md:mt-8 md:h-[420px] md:rounded-[30px] lg:h-[450px] md:bg-transparent"
    >
      <div className="pointer-events-none absolute inset-0 bg-primary/5 md:hidden" aria-hidden="true" />
      <div className="pointer-events-none absolute top-[-31px] left-[-80px] size-[248px] rounded-full bg-primary/35 md:hidden" aria-hidden="true" />
      <div className="pointer-events-none absolute top-[-10px] left-[73px] size-[248px] rounded-full bg-primary/15 md:hidden" aria-hidden="true" />

      <div className="relative h-[190px] px-4 pt-1.5 md:h-[420px] lg:h-[450px] md:px-0 md:pt-[43px] md:pl-10">
        <div className="flex w-[52%] flex-col md:w-[calc(100%-340px)] lg:w-[600px]">
          <p className="text-xs leading-4 md:text-sm md:leading-4">Bem-vindo à Kurio</p>
          <h1
            id="hero-title"
            className="text-base leading-[29px] font-bold md:mt-2 md:text-[30px] md:leading-[48px] lg:text-[43px] lg:leading-[70px]"
          >
            <span className="md:hidden">
              SEJA DONO DA
              <br />
              CULTURA DIGITAL
            </span>
            <span className="hidden md:inline">
              SEJA DONO DO FUTURO
              <br />
              DA ARTE DIGITAL
            </span>
          </h1>
          <p className="mt-1.5 text-[11px] leading-[17px] text-muted-foreground min-[414px]:text-xs min-[414px]:leading-[18px] md:mt-1 md:max-w-[557px] md:text-sm md:leading-6">
            <span className="md:hidden">Descubra NFTs selecionados de criadores do mundo todo.</span>
            <span className="hidden md:inline">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma
              parte da cultura da internet.
            </span>
          </p>
          <a
            href="#catalogo"
            onClick={(event) => {
              event.preventDefault()
              scrollToCatalog()
            }}
            // laranja um tom mais claro: o link fica sobre o círculo decorativo (#674228) e precisa de 4,5:1
            className="mt-0.5 flex w-fit items-center gap-1 text-xs font-bold tracking-wide text-[#f3b06f] md:hidden"
          >
            EXPLORAR
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <Button onClick={scrollToCatalog} className="mt-8 hidden h-10 w-[140px] md:inline-flex">
            EXPLORAR
          </Button>
        </div>

        <div className="absolute top-2.5 right-4 w-[37.7%] md:hidden">
          <img
            {...nftImageProps('emerald-ape', '(min-width: 414px) 138px, 37vw')}
            alt="Emerald Ape #042, destaque da coleção Kurio Apes"
            fetchPriority="high"
            className="aspect-square w-full rounded-2xl object-cover"
          />
          <img
            {...nftImageProps('sage-nomad', '58px')}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute top-[63.8%] left-[10%] aspect-square w-[42%] rounded-lg border-2 border-foreground object-cover"
          />
        </div>

        <img
          {...nftImageProps('emerald-ape', '450px')}
          alt="Emerald Ape #042, destaque da coleção Kurio Apes"
          fetchPriority="high"
          className="absolute top-0 right-0 hidden size-[300px] rounded-[30px] lg:size-[450px] object-cover md:block"
        />
      </div>

      <div
        className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5 md:bottom-11 md:left-[600px] md:translate-x-0 md:gap-2"
        aria-hidden="true"
      >
        <span className="size-[7px] rounded-full bg-primary md:size-2" />
        <span className="size-[7px] rounded-full bg-primary md:size-2" />
        <span className="size-[7px] rounded-full bg-primary md:size-2" />
      </div>
    </section>
  )
}
