import { useCallback, useRef, useState } from 'react'

import type { Network, NftFacets } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'

import { FacetListPlaceholder } from './FacetListPlaceholder'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const MIN_LIMIT = 0
const MAX_LIMIT = 20

/**
 * Valores dos filtros do catálogo.
 */
export interface FilterValues {
  /** Coleção selecionada; ausente significa "Todas". */
  collection?: string | undefined
  /** Rede selecionada; ausente significa "Todas". */
  network?: Network | undefined
  /** Preço mínimo em ETH como string decimal. */
  priceMin?: string | undefined
  /** Preço máximo em ETH como string decimal. */
  priceMax?: string | undefined
}

/** Props de {@link FilterSidebar}. */
export interface FilterSidebarProps {
  /**
   * Coleções e redes com as contagens da API (facetas). Ausente enquanto a
   * primeira consulta carrega.
   */
  facets: NftFacets | undefined
  /** Filtros ativos. */
  value: FilterValues
  /** Aplica um subconjunto de filtros; a página deve voltar para 1. */
  onChange: (patch: Partial<FilterValues>) => void
  /** Oculta o banner promocional inferior (útil no modal de filtros mobile). */
  hideBanner?: boolean
  /** Prefixo opcional para os inputs de rádio para evitar conflito de grupo no DOM. */
  namePrefix?: string
}

/**
 * Barra lateral de filtros e banner em destaque do catálogo.
 * Medidas e hierarquia 100% idênticas ao Figma (`Sidebar`, 310px wide):
 * - Painel de Filtros (310px x 785px, background: #241612)
 * - Banner NFT em Destaque (310px x 470px, degradê e arte com cantos de 22px)
 *
 * @param props - {@link FilterSidebarProps}
 * @returns Coluna lateral completa de 310px.
 */
export function FilterSidebar({
  facets,
  value,
  onChange,
  hideBanner = false,
  namePrefix,
}: FilterSidebarProps) {
  const [prevPriceProps, setPrevPriceProps] = useState({
    priceMin: value.priceMin,
    priceMax: value.priceMax,
  })
  const [range, setRange] = useState<[number, number]>(() => {
    const pMin = Number(value.priceMin)
    const pMax = Number(value.priceMax)
    return [!isNaN(pMin) && pMin >= 0 ? pMin : 0.02, !isNaN(pMax) && pMax > 0 ? pMax : 12.3]
  })

  if (value.priceMin !== prevPriceProps.priceMin || value.priceMax !== prevPriceProps.priceMax) {
    setPrevPriceProps({ priceMin: value.priceMin, priceMax: value.priceMax })
    const pMin = Number(value.priceMin)
    const pMax = Number(value.priceMax)
    setRange([!isNaN(pMin) && pMin >= 0 ? pMin : 0.02, !isNaN(pMax) && pMax > 0 ? pMax : 12.3])
  }

  const [minVal, maxVal] = range
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null)

  const minPercent = Math.min(
    100,
    Math.max(0, ((minVal - MIN_LIMIT) / (MAX_LIMIT - MIN_LIMIT)) * 100),
  )
  const maxPercent = Math.min(
    100,
    Math.max(0, ((maxVal - MIN_LIMIT) / (MAX_LIMIT - MIN_LIMIT)) * 100),
  )

  const getValueFromPointer = useCallback((clientX: number) => {
    if (!trackRef.current) return 0
    const rect = trackRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const rawValue = MIN_LIMIT + percentage * (MAX_LIMIT - MIN_LIMIT)
    return Math.round(rawValue * 100) / 100
  }, [])

  const startDrag = useCallback(
    (type: 'min' | 'max') => {
      setActiveThumb(type)

      const onPointerMove = (e: PointerEvent) => {
        const val = getValueFromPointer(e.clientX)
        setRange(([currentMin, currentMax]) => {
          if (type === 'min') {
            const clamped = Math.min(val, currentMax - 0.1)
            return [Math.max(MIN_LIMIT, Number(clamped.toFixed(2))), currentMax]
          } else {
            const clamped = Math.max(val, currentMin + 0.1)
            return [currentMin, Math.min(MAX_LIMIT, Number(clamped.toFixed(2)))]
          }
        })
      }

      const onPointerUp = () => {
        setActiveThumb(null)
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
        window.removeEventListener('pointercancel', onPointerUp)
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerUp)
    },
    [getValueFromPointer],
  )

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).getAttribute('role') === 'slider') return
    const clickedVal = getValueFromPointer(e.clientX)
    const distMin = Math.abs(clickedVal - minVal)
    const distMax = Math.abs(clickedVal - maxVal)

    if (distMin <= distMax) {
      const clamped = Math.min(clickedVal, maxVal - 0.1)
      setRange([Math.max(MIN_LIMIT, Number(clamped.toFixed(2))), maxVal])
      startDrag('min')
    } else {
      const clamped = Math.max(clickedVal, minVal + 0.1)
      setRange([minVal, Math.min(MAX_LIMIT, Number(clamped.toFixed(2)))])
      startDrag('max')
    }
  }

  const handleThumbPointerDown = (type: 'min' | 'max', e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startDrag(type)
  }

  const handleKeyDown = (type: 'min' | 'max', e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 1.0 : 0.1
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      setRange(([currentMin, currentMax]) => {
        if (type === 'min') {
          return [Math.max(MIN_LIMIT, Number((currentMin - step).toFixed(2))), currentMax]
        }
        return [currentMin, Math.max(currentMin + 0.1, Number((currentMax - step).toFixed(2)))]
      })
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      setRange(([currentMin, currentMax]) => {
        if (type === 'min') {
          return [Math.min(currentMax - 0.1, Number((currentMin + step).toFixed(2))), currentMax]
        }
        return [currentMin, Math.min(MAX_LIMIT, Number((currentMax + step).toFixed(2)))]
      })
    } else if (e.key === 'Home') {
      e.preventDefault()
      setRange(([currentMin, currentMax]) =>
        type === 'min' ? [MIN_LIMIT, currentMax] : [currentMin, currentMin + 0.1],
      )
    } else if (e.key === 'End') {
      e.preventDefault()
      setRange(([currentMin, currentMax]) =>
        type === 'min' ? [currentMax - 0.1, currentMax] : [currentMin, MAX_LIMIT],
      )
    }
  }

  function handleCollectionClick(collectionValue: string) {
    const isSelected = value.collection === collectionValue
    onChange({ collection: isSelected ? undefined : collectionValue })
  }

  function handleNetworkClick(networkValue: Network) {
    const isSelected = value.network === networkValue
    onChange({ network: isSelected ? undefined : networkValue })
  }

  function handleApplyPrice() {
    onChange({
      priceMin: minVal.toFixed(2),
      priceMax: maxVal.toFixed(2),
    })
  }

  return (
    <aside
      aria-label="Filtros do catálogo"
      className="flex w-full flex-col gap-6 lg:w-[310px] lg:shrink-0"
    >
      {/* Filters: 310px x 785px, padding 20px, bg: #241612 */}
      <div className="flex w-full flex-col bg-[#241612] p-5 lg:h-[785px] lg:w-[310px]">
        {/* Frame 140: 270px x 745px, gap: 40px */}
        <div className="flex w-full flex-col gap-10 lg:w-[270px]">
          {/* Collections Filter: 270px x 388px, gap: 12px */}
          <div
            role="radiogroup"
            aria-labelledby="filter-collections-title"
            className="flex flex-col gap-3"
          >
            <h2
              id="filter-collections-title"
              className="font-mono text-[18px] leading-4 font-bold text-foreground"
            >
              Coleções
            </h2>

            {/* List: 270px x 360px, padding: 0 12px */}
            <div className="flex flex-col px-3">
              {!facets && <FacetListPlaceholder rows={9} />}
              {facets?.collections.map((item) => {
                const isSelected = value.collection === item.value
                return (
                  <label
                    key={item.value}
                    className={cn(
                      'group relative flex h-[40px] w-full cursor-pointer items-center justify-between font-mono text-[15px] leading-[40px] transition-colors duration-150',
                      isSelected ? 'text-highlight' : 'text-text-secondary hover:text-highlight',
                    )}
                  >
                    <input
                      type="radio"
                      name={namePrefix ? `${namePrefix}-collection` : 'collection'}
                      value={item.value}
                      checked={isSelected}
                      onChange={() => handleCollectionClick(item.value)}
                      className="absolute inset-0 z-10 cursor-pointer opacity-0"
                    />
                    <span className="pointer-events-none transition-colors duration-150">
                      {item.value}
                    </span>
                    <span
                      className={cn(
                        'pointer-events-none text-right transition-colors duration-150',
                        isSelected
                          ? 'font-bold text-highlight'
                          : 'font-bold text-text-secondary group-hover:text-highlight',
                      )}
                    >
                      ({item.count})
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Price Filter: 270px x 129px, gap: 12px */}
          <div role="group" aria-labelledby="filter-price-title" className="flex flex-col gap-3">
            <h2
              id="filter-price-title"
              className="font-mono text-[18px] leading-4 font-bold text-foreground"
            >
              Faixa de preço
            </h2>

            {/* Controls: padding 0 0 0 12px, gap: 12px */}
            <div className="flex flex-col gap-3 pl-3">
              {/* Slider: 258px x 21px */}
              <div
                ref={trackRef}
                onPointerDown={handleTrackPointerDown}
                className="relative flex h-[21px] w-[258px] cursor-pointer touch-none select-none items-center"
              >
                {/* Full inactive track */}
                <div className="h-1 w-full rounded-full bg-[#CFB28C]/30" />

                {/* Active bar between thumbs */}
                <div
                  className="pointer-events-none absolute h-1 rounded-full bg-primary"
                  style={{
                    left: `${minPercent}%`,
                    width: `${Math.max(0, maxPercent - minPercent)}%`,
                  }}
                />

                {/* Left thumb (min) */}
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label="Preço mínimo em ETH"
                  aria-valuemin={MIN_LIMIT}
                  aria-valuemax={maxVal}
                  aria-valuenow={minVal}
                  aria-valuetext={`${minVal.toFixed(2)} ETH`}
                  onPointerDown={(e) => handleThumbPointerDown('min', e)}
                  onKeyDown={(e) => handleKeyDown('min', e)}
                  style={{ left: `${minPercent}%` }}
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
                    'size-[15px] rounded-full border-[3px] border-[#140D0A] bg-primary',
                    'cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.5)] transition-colors',
                    'hover:bg-highlight focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    activeThumb === 'min' ? 'z-40' : 'z-30',
                  )}
                />

                {/* Right thumb (max) */}
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label="Preço máximo em ETH"
                  aria-valuemin={minVal}
                  aria-valuemax={MAX_LIMIT}
                  aria-valuenow={maxVal}
                  aria-valuetext={`${maxVal.toFixed(2)} ETH`}
                  onPointerDown={(e) => handleThumbPointerDown('max', e)}
                  onKeyDown={(e) => handleKeyDown('max', e)}
                  style={{ left: `${maxPercent}%` }}
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
                    'size-[15px] rounded-full border-[3px] border-[#140D0A] bg-primary',
                    'cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.5)] transition-colors',
                    'hover:bg-highlight focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    activeThumb === 'max' ? 'z-40' : 'z-30',
                  )}
                />
              </div>

              {/* Frame 391: Preço text */}
              <div className="flex h-[20px] w-[258px] items-center">
                <span className="font-mono text-[15px] leading-5 text-foreground">
                  Preço: {minVal.toFixed(2).replace('.', ',')} -{' '}
                  {maxVal.toFixed(2).replace('.', ',')} ETH
                </span>
              </div>

              {/* Apply Button: 92px x 36px, rounded 6px, bg: #D28A4C */}
              <button
                type="button"
                onClick={handleApplyPrice}
                className={cn(
                  'flex h-[36px] w-[92px] cursor-pointer items-center justify-center rounded-[6px] bg-primary font-mono text-[16px] leading-5 font-bold text-ink transition-colors duration-150 hover:bg-highlight',
                  focusRing,
                )}
              >
                Aplicar
              </button>
            </div>
          </div>

          {/* Network Filter: 270px x 148px, gap: 12px */}
          <div
            role="radiogroup"
            aria-labelledby="filter-network-title"
            className="flex flex-col gap-3"
          >
            <h2
              id="filter-network-title"
              className="font-mono text-[18px] leading-4 font-bold text-foreground"
            >
              Rede
            </h2>

            {/* List: padding 0 0 0 12px, 3 items */}
            <div className="flex flex-col pl-3">
              {!facets && <FacetListPlaceholder rows={3} />}
              {facets?.networks.map((net) => {
                const isSelected = value.network === net.value
                return (
                  <label
                    key={net.value}
                    className={cn(
                      'group relative flex h-[40px] w-[258px] cursor-pointer items-center justify-between font-mono text-[15px] leading-[40px] transition-colors duration-150',
                      isSelected ? 'text-highlight' : 'text-text-secondary hover:text-highlight',
                    )}
                  >
                    <input
                      type="radio"
                      name={namePrefix ? `${namePrefix}-network` : 'network'}
                      value={net.value}
                      checked={isSelected}
                      onChange={() => handleNetworkClick(net.value)}
                      className="absolute inset-0 z-10 cursor-pointer opacity-0"
                    />
                    <span className="pointer-events-none transition-colors duration-150">
                      {net.value}
                    </span>
                    <span
                      className={cn(
                        'pointer-events-none text-right transition-colors duration-150',
                        isSelected
                          ? 'font-bold text-highlight'
                          : 'font-normal text-text-secondary group-hover:text-highlight',
                      )}
                    >
                      ({net.count})
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Featured NFT Banner: 310px x 470px */}
      {!hideBanner && (
        <div
          className="relative flex h-[470px] w-full flex-col items-center pt-6 pb-1 lg:w-[310px]"
          style={{
            background:
              'linear-gradient(180deg, rgba(210, 138, 76, 0.1) 0%, rgba(210, 138, 76, 0.03) 100%)',
          }}
        >
          <div className="flex h-[448px] w-full flex-col gap-4 px-0">
            <div className="flex h-[64px] w-full flex-col items-center gap-4">
              <h3 className="h-8 w-full text-center font-mono text-[24px] leading-8 font-bold text-highlight">
                NFT EM DESTAQUE
              </h3>
              <p className="h-4 w-full text-center font-mono text-[22px] leading-4 font-bold text-foreground">
                OFERTA LIMITADA
              </p>
            </div>

            <div className="relative mx-auto h-[368px] w-full overflow-hidden rounded-[22px]">
              <img
                src="/images/NFT-Artwork-18.webp"
                alt="NFT em destaque: Oferta Limitada"
                width={310}
                height={368}
                className="h-[368px] w-full rounded-[22px] object-cover"
              />

              {/* Decorative Floating Elements from Figma */}
              {/* Rectangle 30: 22px x 22px, left 16px, top 299px */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-[299px] left-[16px] size-[22px] rounded-[7px] border border-primary/40 opacity-20"
              />
              {/* Rectangle 31: 45px x 45px, left 248px, top 343px */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-[343px] left-[248px] size-[45px] rounded-[29px]"
                style={{
                  background:
                    'linear-gradient(145.46deg, rgba(210, 138, 76, 0.3) -46.09%, rgba(210, 138, 76, 0) 103.28%)',
                }}
              />
              {/* Rectangle 32: 15px x 15px, left 38px, top 105px */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-[105px] left-[38px] size-[15px] rounded-[29px]"
                style={{
                  background:
                    'linear-gradient(145.46deg, rgba(210, 138, 76, 0.3) -46.09%, rgba(210, 138, 76, 0) 103.28%)',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
