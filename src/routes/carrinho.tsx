import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react'

import {
  cartQueryOptions,
  quoteQueryOptions,
  useRemoveCartItem,
  useUpdateCartItem,
} from '@/features/cart/api'
import { CartItemNotice } from '@/features/cart/components/CartItemNotice'
import { readStoredCoupon, storeCoupon } from '@/features/cart/coupon-storage'
import { nftsQueryOptions } from '@/features/catalog/api'
import { formatTokenId } from '@/features/checkout/format'
import { ApiError } from '@/shared/api/http-client'
import { CartSummarySkeleton } from '@/shared/components/skeletons/CartSummarySkeleton'
import { DEFAULT_NFT_LIST_QUERY } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'
import { formatEth, mul } from '@/shared/lib/money'

export const Route = createFileRoute('/carrinho')({
  component: CartPage,
})

/** Quantos relacionados mostrar por página (linha de 5 cards do Figma). */
const RELATED_COUNT = 5

/** Páginas do carrossel de relacionados (3 bolinhas do Figma). */
const RELATED_PAGES = 3

function CartPage() {
  const cartQuery = useQuery(cartQueryOptions())
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()

  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCouponState] = useState(readStoredCoupon)

  function setAppliedCoupon(code: string | undefined) {
    setAppliedCouponState(code)
    storeCoupon(code)
  }
  const [activeDot, setActiveDot] = useState(0)
  const [isDeleteMode, setIsDeleteMode] = useState(false)

  const items = cartQuery.data?.items ?? []
  const quoteRequest = {
    items: items.map((item) => ({
      nftId: item.nftId,
      editionId: item.editionId,
      quantity: item.quantity,
    })),
    ...(appliedCoupon ? { couponCode: appliedCoupon } : {}),
  }
  const quote = useQuery(quoteQueryOptions(quoteRequest))
  // Busca o suficiente para 3 páginas de 5, já descontando os itens do carrinho.
  const relatedQuery = useQuery(
    nftsQueryOptions({
      ...DEFAULT_NFT_LIST_QUERY,
      pageSize: RELATED_COUNT * RELATED_PAGES + items.length,
    }),
  )
  const cartNftIds = new Set(items.map((item) => item.nftId))
  const relatedPool = (relatedQuery.data?.items ?? []).filter((nft) => !cartNftIds.has(nft.id))
  const relatedPageCount = Math.max(1, Math.ceil(relatedPool.length / RELATED_COUNT))
  const activeRelatedPage = Math.min(activeDot, relatedPageCount - 1)
  const related = relatedPool.slice(
    activeRelatedPage * RELATED_COUNT,
    (activeRelatedPage + 1) * RELATED_COUNT,
  )

  if (cartQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 xl:px-0">
        <CartSummarySkeleton />
      </div>
    )
  }

  const couponError = quote.error instanceof ApiError ? quote.error : null

  return (
    <>
      {/* Desktop / Carrinho (preserved 100% for desktop screens & visual tests) */}
      <div className="mx-auto hidden w-full max-w-[1248px] flex-col gap-[96px] px-4 py-6 sm:px-6 md:flex">
        {/* Top Section: Breadcrumb + Cart Body */}
        <section aria-label="Carrinho de NFTs" className="flex w-full flex-col gap-8">
          {items.length > 0 && <h1 className="sr-only">Carrinho de NFTs</h1>}
          {/* Breadcrumb: Início / Mercado / Carrinho */}
          <nav
            aria-label="Breadcrumb"
            className="flex h-4 items-center gap-2 font-mono text-[15px] leading-4 font-bold text-[#F5F1EB]"
          >
            <Link
              to="/"
              search={DEFAULT_NFT_LIST_QUERY}
              className="transition-colors hover:text-primary"
            >
              Início
            </Link>
            <span className="text-[#F5F1EB]">/</span>
            <Link
              to="/"
              search={DEFAULT_NFT_LIST_QUERY}
              className="transition-colors hover:text-primary"
            >
              Mercado
            </Link>
            <span className="text-[#F5F1EB]">/</span>
            <span className="text-[#F5F1EB]">Carrinho</span>
          </nav>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[12px] border border-[#3F2319] bg-[#241612] px-6 py-16 text-center">
              <h1 className="font-mono text-2xl font-bold text-[#F5F1EB]">
                Seu carrinho está vazio
              </h1>
              <p className="mt-2 font-mono text-sm text-[#CFB28C]">
                Explore o catálogo e adicione colecionáveis digitais exclusivos.
              </p>
              <Link
                to="/"
                search={DEFAULT_NFT_LIST_QUERY}
                className="mt-6 inline-flex rounded-[6px] bg-primary px-6 py-2.5 font-mono text-sm font-bold text-[#140D0A] transition-colors hover:bg-highlight"
              >
                Explorar NFTs
              </Link>
            </div>
          ) : (
            /* Cart Body: Left (Table 782px) + Right (Summary 332px) */
            <div className="flex w-full flex-col justify-between gap-8 lg:flex-row lg:items-start lg:gap-12">
              {/* Cart Table: 782px wide */}
              <div className="flex w-full flex-1 flex-col gap-3 lg:max-w-[782px]">
                {/* Table Header: NFTs, Preço, Edições, Total */}
                <div className="hidden h-4 w-full items-center justify-between pr-6 font-mono text-[16px] leading-4 sm:flex">
                  <span className="w-[250px] font-bold text-[#F5F1EB]">NFTs</span>
                  <span className="w-[77px] text-center font-medium text-[#F5F1EB]">Preço</span>
                  <span className="w-[75px] text-center font-bold text-[#F5F1EB]">Edições</span>
                  <span className="w-[87px] text-center font-medium text-[#F5F1EB]">Total</span>
                  <span className="w-[24px]" aria-hidden="true" />
                </div>

                {/* Line 2 */}
                <div className="hidden w-full border-b border-[#D28A4C]/30 pt-1 sm:block" />

                {/* Cart Items List */}
                <ul className="flex flex-col gap-3">
                  {items.map((item) => {
                    const itemTotalEth = mul(item.priceEth, item.quantity.toString())
                    const imgSrc = item.imageUrl
                    const tokenId = formatTokenId(item.nftId)

                    return (
                      <li
                        key={item.id}
                        className="flex min-h-[70px] w-full flex-col justify-between rounded-[6px] bg-[#241612] p-3 transition-colors sm:h-[70px] sm:flex-row sm:items-center sm:p-0 sm:pr-6"
                      >
                        {/* 1. NFT Info: Image (70x70) + Title/ID */}
                        <div className="flex items-center gap-4 sm:w-[250px]">
                          <img
                            src={imgSrc}
                            alt={item.name}
                            className="size-[70px] shrink-0 rounded-[6px] object-cover"
                          />
                          <div className="flex min-w-0 flex-col gap-1.5 font-mono">
                            <Link
                              to="/nft/$nftId"
                              params={{ nftId: item.nftId }}
                              className="truncate text-[16px] leading-4 font-bold text-[#F5F1EB] transition-colors hover:text-primary"
                            >
                              {item.name}
                            </Link>
                            <span className="text-[14px] leading-4 font-normal text-[#B39463]">
                              ID do token: {tokenId} · {item.editionName}
                            </span>
                            <CartItemNotice item={item} />
                          </div>
                        </div>

                        {/* Mobile Row with Price, Stepper, Total, Delete */}
                        <div className="mt-3 flex items-center justify-between sm:mt-0 sm:contents">
                          {/* 2. Unit Price */}
                          <div className="font-mono text-[16px] leading-4 font-bold whitespace-nowrap text-[#CFB28C] sm:w-[77px] sm:text-center">
                            {formatEth(item.priceEth)} ETH
                          </div>

                          {/* 3. Stepper: Minus (20x30 pill) + Qty + Plus (20x30 pill) */}
                          <div className="flex h-[30px] items-center justify-center gap-3 sm:w-[75px]">
                            <button
                              type="button"
                              aria-label={`Diminuir quantidade de ${item.name}`}
                              disabled={updateItem.isPending || item.quantity <= 1}
                              onClick={() => {
                                const next = Math.max(1, item.quantity - 1)
                                updateItem.mutate({ itemId: item.id, quantity: next })
                              }}
                              className="flex h-[30px] w-[20px] cursor-pointer items-center justify-center rounded-[20px] border border-[#140D0A] bg-primary text-[#000000] shadow-[0px_4px_12px_-2px_rgba(20,13,10,0.15)] transition-colors hover:bg-highlight disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Minus aria-hidden="true" className="size-3.5 stroke-[2.5]" />
                            </button>
                            <span className="min-w-[11px] text-center font-mono text-[17px] leading-6 font-normal text-[#F5F1EB]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Aumentar quantidade de ${item.name}`}
                              disabled={
                                updateItem.isPending || item.quantity >= Math.max(1, item.available)
                              }
                              onClick={() => {
                                const next = Math.min(
                                  Math.max(1, item.available),
                                  item.quantity + 1,
                                )
                                updateItem.mutate({ itemId: item.id, quantity: next })
                              }}
                              className="flex h-[30px] w-[20px] cursor-pointer items-center justify-center rounded-[20px] border border-[#140D0A] bg-primary text-[#000000] shadow-[0px_4px_12px_-2px_rgba(20,13,10,0.15)] transition-colors hover:bg-highlight disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Plus aria-hidden="true" className="size-3.5 stroke-[2.5]" />
                            </button>
                          </div>

                          {/* 4. Item Total */}
                          <div className="font-mono text-[16px] leading-4 font-bold whitespace-nowrap text-[#E89B55] sm:w-[87px] sm:text-center">
                            {formatEth(itemTotalEth)} ETH
                          </div>

                          {/* 5. Delete Button */}
                          <div className="flex items-center justify-end sm:w-[24px]">
                            <button
                              type="button"
                              onClick={() => removeItem.mutate(item.id)}
                              aria-label={`Remover ${item.name} do carrinho`}
                              className="p-1 text-[#B39463] transition-colors hover:text-[#E89B55]"
                            >
                              <Trash2 aria-hidden="true" className="size-5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Wallet Summary: 332px wide */}
              <aside
                aria-label="Resumo da carteira"
                className="flex w-full flex-col gap-6 lg:w-[332px] lg:shrink-0"
              >
                {/* Heading */}
                <div className="flex flex-col gap-3">
                  <h2 className="font-mono text-[18px] leading-4 font-bold text-[#F5F1EB]">
                    Resumo da carteira
                  </h2>
                  <div className="w-full border-b border-[#D28A4C]/30" />
                </div>

                {/* Promo Code */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="promo-code-input"
                    className="font-mono text-[14px] leading-4 font-bold text-[#F5F1EB]"
                  >
                    Código promocional
                  </label>

                  {appliedCoupon ? (
                    <div className="flex h-[40px] items-center justify-between rounded-[3px] border border-primary bg-primary/10 px-3 font-mono text-[14px]">
                      <span className="font-bold text-[#E89B55]">{appliedCoupon}</span>
                      <button
                        type="button"
                        onClick={() => setAppliedCoupon(undefined)}
                        className="text-xs text-[#CFB28C] underline hover:text-foreground"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (couponInput.trim()) {
                          setAppliedCoupon(couponInput.trim().toUpperCase())
                        }
                      }}
                      className="flex h-[40px] w-full items-center rounded-[3px] border border-primary"
                    >
                      <input
                        id="promo-code-input"
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Digite o código promocional..."
                        className="h-full min-w-0 flex-1 bg-transparent px-2 font-mono text-[12px] leading-4 text-[#F5F1EB] placeholder:text-[#B39463] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="flex h-[40px] w-[102px] shrink-0 cursor-pointer items-center justify-center rounded-r-[2px] bg-primary font-mono text-[15px] leading-4 font-bold text-[#140D0A] transition-colors hover:bg-highlight"
                      >
                        Aplicar
                      </button>
                    </form>
                  )}
                  {couponError && (
                    <p role="alert" className="font-mono text-xs text-error">
                      {couponError.code === 'COUPON_EXPIRED'
                        ? 'Cupom expirado.'
                        : 'Cupom inválido.'}
                    </p>
                  )}
                </div>

                {/* Fees / Totals */}
                <div className="flex flex-col gap-3 font-mono">
                  {/* Subtotal */}
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] leading-5 font-normal text-[#F5F1EB]">
                      Subtotal
                    </span>
                    <span className="text-[18px] leading-4 font-normal text-[#F5F1EB]">
                      {quote.data ? `${formatEth(quote.data.subtotalEth)} ETH` : '—'}
                    </span>
                  </div>

                  {/* Desconto do lançamento */}
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] leading-5 font-normal text-[#F5F1EB]">
                      Desconto do lançamento
                    </span>
                    <span className="text-[15px] leading-5 font-normal text-[#F5F1EB]">
                      {quote.data && quote.data.discountEth !== '0'
                        ? `(-) ${formatEth(quote.data.discountEth)} ETH`
                        : '(-) 00.00'}
                    </span>
                  </div>

                  {/* Taxa de rede */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] leading-5 font-normal text-[#F5F1EB]">
                        Taxa de rede
                      </span>
                      <span className="text-[18px] leading-4 font-normal text-[#F5F1EB]">
                        {quote.data ? `${formatEth(quote.data.networkFeeEth)} ETH` : '—'}
                      </span>
                    </div>
                    <span className="text-right text-[12px] leading-4 font-normal text-[#E89B55]">
                      Taxa estimada
                    </span>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[16px] leading-4 font-bold text-[#F5F1EB]">Total</span>
                    <span className="text-[18px] leading-4 font-bold text-[#E89B55]">
                      {quote.data ? `${formatEth(quote.data.totalEth)} ETH` : '—'}
                    </span>
                  </div>
                </div>

                {/* Checkout CTA Buttons */}
                <div className="flex flex-col items-center gap-3 pt-2">
                  <Link
                    to="/pagamento"
                    aria-label="Finalizar compra"
                    className={cn(
                      'flex h-[40px] w-full cursor-pointer items-center justify-center rounded-[3px] bg-primary font-mono text-[15px] leading-4 font-bold text-[#140D0A] transition-colors hover:bg-highlight',
                      (!quote.data || items.length === 0) &&
                        'pointer-events-none cursor-not-allowed opacity-50',
                    )}
                  >
                    Conectar e finalizar
                  </Link>

                  <Link
                    to="/"
                    search={DEFAULT_NFT_LIST_QUERY}
                    className="font-mono text-[15px] leading-5 font-normal text-[#E89B55] transition-colors hover:underline"
                  >
                    Continuar explorando
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </section>

        {/* Related Products: "Colecionadores também viram" */}
        <section aria-labelledby="related-heading" className="flex w-full flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2
              id="related-heading"
              className="font-mono text-[17px] leading-4 font-bold text-[#E89B55]"
            >
              Colecionadores também viram
            </h2>
            <div className="w-full border-b border-[#D28A4C]/30" />
          </div>

          {/* 5 Cards Row */}
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:flex lg:justify-between lg:gap-[28px]">
            {related.map((item) => (
              <Link
                key={item.id}
                to="/nft/$nftId"
                params={{ nftId: item.id }}
                className="group flex flex-col gap-2 lg:w-[219px]"
              >
                <div className="flex h-[255px] w-full items-center justify-center rounded-[17px] bg-[#241612] p-2 transition-transform group-hover:scale-[1.02]">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="size-[212px] max-h-full max-w-full rounded-[15px] object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1 font-mono pt-1">
                  <p className="truncate text-[15px] leading-5 text-[#F5F1EB] transition-colors group-hover:text-primary">
                    {item.name}
                  </p>
                  <p className="text-[16px] leading-4 font-bold text-[#E89B55]">
                    {formatEth(item.priceEth)} ETH
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Carousel Dots */}
          {relatedPageCount > 1 && (
            <div
              role="group"
              className="flex items-center justify-center gap-2 pt-2"
              aria-label="Navegação do carrossel"
            >
              {Array.from({ length: relatedPageCount }, (_, page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setActiveDot(page)}
                  aria-label={`Ir para a página ${page + 1} de ${relatedPageCount}`}
                  aria-current={activeRelatedPage === page ? 'true' : undefined}
                  className={cn(
                    'size-[12px] cursor-pointer rounded-full transition-colors',
                    activeRelatedPage === page ? 'bg-primary' : 'border-[1.3px] border-primary',
                  )}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Mobile / Carrinho de NFTs (Figma mobile: 414px, #140D0A) */}
      <div className="flex min-h-[100dvh] w-full flex-1 flex-col justify-between bg-[#140D0A] pt-8 md:hidden">
        {/* Screen Header: Back Button + Title "Carrinho de NFTs" + Modo de Excluir */}
        <div className="flex w-full flex-col items-center px-7">
          <div className="relative flex h-[44px] w-full max-w-[358px] items-center justify-between">
            <button
              type="button"
              onClick={() => window.history.back()}
              aria-label="Voltar"
              className="flex size-[35px] cursor-pointer items-center justify-center rounded-full border border-[#3F2319] bg-[#2F1D15] transition-colors hover:border-[#B39463]"
            >
              <ArrowLeft className="size-4 text-[#B39463]" strokeWidth={2} />
            </button>

            <h1 className="font-mono text-[19px] font-bold leading-4 text-[#F5F1EB]">
              Carrinho de NFTs
            </h1>

            {items.length > 0 ? (
              <button
                type="button"
                onClick={() => setIsDeleteMode(!isDeleteMode)}
                aria-label={isDeleteMode ? 'Concluir modo de exclusão' : 'Ativar modo de exclusão'}
                className={cn(
                  'flex h-[32px] cursor-pointer items-center gap-1.5 rounded-full border px-3 font-mono text-[13px] font-medium transition-all active:scale-95',
                  isDeleteMode
                    ? 'border-[#D28A4C] bg-[#D28A4C] font-bold text-[#140D0A] shadow-md'
                    : 'border-[#3F2319] bg-[#2F1D15] text-[#CFB28C] hover:border-[#D28A4C]/60 hover:text-[#E89B55]',
                )}
              >
                <Trash2 className="size-3.5" />
                <span>{isDeleteMode ? 'Pronto' : 'Excluir'}</span>
              </button>
            ) : (
              <div className="w-[35px]" />
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-7 py-16 text-center">
            <h2 className="font-mono text-xl font-bold text-[#F5F1EB]">Seu carrinho está vazio</h2>
            <p className="mt-2 font-mono text-sm text-[#CFB28C]">
              Explore o catálogo e adicione colecionáveis digitais exclusivos.
            </p>
            <Link
              to="/"
              search={DEFAULT_NFT_LIST_QUERY}
              className="mt-6 inline-flex h-[50px] w-full max-w-[358px] items-center justify-center rounded-[40px] bg-gradient-to-r from-[#D28A4C] to-[#E89B55] font-mono text-sm font-bold text-[#140D0A] transition-colors"
            >
              Explorar NFTs
            </Link>
          </div>
        ) : (
          <>
            {/* Top Items Section */}
            <div className="flex w-full flex-col items-center">
              {/* Informative banner when in Delete Mode */}
              {isDeleteMode && (
                <div className="mt-3 flex w-full flex-col items-center px-7">
                  <div className="flex w-full max-w-[358px] items-center justify-between rounded-[10px] border border-[#D28A4C]/40 bg-[#241612] px-3.5 py-2">
                    <span className="font-mono text-[13px] text-[#CFB28C]">
                      Modo de exclusão ativo
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        items.forEach((item) => removeItem.mutate(item.id))
                        setIsDeleteMode(false)
                      }}
                      className="cursor-pointer font-mono text-[13px] font-bold text-[#E89B55] underline hover:text-[#F5F1EB]"
                    >
                      Limpar tudo
                    </button>
                  </div>
                </div>
              )}

              {/* Cart Items List */}
              <div className="mt-3 flex w-full flex-col items-center px-7">
                <div className="flex w-full max-w-[358px] flex-col gap-4">
                  {items.map((item) => {
                    const itemTotalEth = mul(item.priceEth, item.quantity.toString())
                    const imgSrc = item.imageUrl
                    const editionText = `Edição: ${item.editionName}`

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'relative flex h-[104px] w-full max-w-[358px] overflow-hidden rounded-[14px] bg-[#241612] shadow-[0px_6px_20px_rgba(10,6,4,0.45)] transition-all',
                          isDeleteMode && 'border border-[#D28A4C]/60',
                        )}
                      >
                        {/* Thumbnail: 104x104px, rounded-l-[14px] */}
                        <div className="relative size-[104px] shrink-0 overflow-hidden rounded-l-[14px]">
                          <img src={imgSrc} alt={item.name} className="size-full object-cover" />
                        </div>

                        {/* Info: Title, Edition, Price */}
                        <div className="flex flex-1 flex-col justify-between py-[12px] pl-3 pr-2.5 font-mono">
                          <div className="flex flex-col gap-1 pr-8">
                            <Link
                              to="/nft/$nftId"
                              params={{ nftId: item.nftId }}
                              className="truncate text-[15px] font-bold leading-4 text-[#F5F1EB] hover:text-[#E89B55]"
                            >
                              {item.name}
                            </Link>
                            <span className="text-[13px] font-normal leading-4 text-[#CFB28C]">
                              {editionText}
                            </span>
                            <CartItemNotice item={item} />
                          </div>
                          <div className="text-[17px] font-bold leading-4 text-[#E89B55]">
                            {formatEth(itemTotalEth)} ETH
                          </div>
                        </div>

                        {/* Action Area: Delete Mode vs Normal Mode */}
                        {isDeleteMode ? (
                          <button
                            type="button"
                            aria-label={`Excluir ${item.name} do carrinho`}
                            onClick={() => removeItem.mutate(item.id)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-[34px] cursor-pointer items-center gap-1.5 rounded-full border border-[#D28A4C] bg-[#2F1D15] px-3 font-mono text-[13px] font-bold text-[#E89B55] shadow-sm transition-all hover:bg-[#D28A4C] hover:text-[#140D0A] active:scale-95"
                          >
                            <Trash2 className="size-4" />
                            <span>Excluir</span>
                          </button>
                        ) : (
                          <>
                            {/* Top-Right Trash Button with dedicated space */}
                            <button
                              type="button"
                              aria-label={`Remover ${item.name} do carrinho`}
                              onClick={() => removeItem.mutate(item.id)}
                              className="absolute right-3 top-2.5 flex size-7 cursor-pointer items-center justify-center rounded-full border border-[#3F2319] bg-[#2F1D15] text-[#CFB28C] transition-colors hover:border-[#D28A4C] hover:text-[#E89B55] active:scale-95"
                            >
                              <Trash2 className="size-3.5" />
                            </button>

                            {/* Bottom-Right Stepper */}
                            <div className="absolute right-3 bottom-2.5 flex h-[24px] items-center gap-2">
                              {/* Minus button */}
                              <button
                                type="button"
                                aria-label={`Diminuir quantidade de ${item.name}`}
                                disabled={updateItem.isPending}
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    updateItem.mutate({
                                      itemId: item.id,
                                      quantity: item.quantity - 1,
                                    })
                                  } else {
                                    removeItem.mutate(item.id)
                                  }
                                }}
                                className="flex size-6 cursor-pointer items-center justify-center rounded-full border border-[#3F2319] bg-[#2F1D15] transition-colors hover:border-[#CFB28C]"
                              >
                                {item.quantity <= 1 ? (
                                  <Trash2 className="size-3 text-[#CFB28C]" />
                                ) : (
                                  <Minus className="size-3 text-[#F5F1EB]" />
                                )}
                              </button>

                              {/* Quantity number */}
                              <span className="min-w-[12px] text-center font-mono text-[15px] font-medium leading-[20px] text-[#F5F1EB]">
                                {item.quantity}
                              </span>

                              {/* Plus button */}
                              <button
                                type="button"
                                aria-label={`Aumentar quantidade de ${item.name}`}
                                disabled={
                                  updateItem.isPending ||
                                  item.quantity >= Math.max(1, item.available)
                                }
                                onClick={() => {
                                  const next = Math.min(
                                    Math.max(1, item.available),
                                    item.quantity + 1,
                                  )
                                  updateItem.mutate({ itemId: item.id, quantity: next })
                                }}
                                className="flex size-6 cursor-pointer items-center justify-center rounded-full border border-[#3F2319] bg-[#2F1D15] transition-colors hover:border-[#CFB28C] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Plus className="size-3 text-[#F5F1EB]" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Payment Summary Bottom Sheet: in the exact same color as mobile navbar (#241612) and extending to the bottom edge */}
            <div className="mt-8 flex flex-1 w-full flex-col items-center rounded-t-[40px] bg-[#241612] px-6 pt-6 pb-9 shadow-[0px_-6px_20px_rgba(10,6,4,0.45)]">
              <div className="flex w-full max-w-[366px] flex-col gap-3">
                {/* Promo Code Input */}
                {appliedCoupon ? (
                  <div className="flex h-[50px] w-full items-center justify-between rounded-[40px] border border-[#3F2319] bg-[#241612] px-4 font-mono text-[14px] shadow-[0px_6px_20px_rgba(10,6,4,0.45)]">
                    <span className="font-bold text-[#E89B55]">{appliedCoupon}</span>
                    <button
                      type="button"
                      onClick={() => setAppliedCoupon(undefined)}
                      className="text-xs text-[#CFB28C] underline hover:text-[#F5F1EB]"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (couponInput.trim()) {
                        setAppliedCoupon(couponInput.trim().toUpperCase())
                      }
                    }}
                    className="flex h-[50px] w-full items-center rounded-[40px] border border-[#3F2319] bg-[#241612] pl-4 shadow-[0px_6px_20px_rgba(10,6,4,0.45)]"
                  >
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Digite o código promocional..."
                      aria-label="Código promocional"
                      className="h-full min-w-0 flex-1 bg-transparent font-mono text-[13px] leading-[22px] text-[#F5F1EB] placeholder:text-[#B39463] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="flex h-[50px] w-[97px] shrink-0 cursor-pointer items-center justify-center rounded-[40px] bg-gradient-to-r from-[#D28A4C]/54 to-[#D28A4C] font-mono text-[15px] font-bold leading-4 text-[#F5F1EB] transition-opacity hover:opacity-90"
                    >
                      Aplicar
                    </button>
                  </form>
                )}
                {couponError && (
                  <p role="alert" className="font-mono text-xs text-error">
                    {couponError.code === 'COUPON_EXPIRED' ? 'Cupom expirado.' : 'Cupom inválido.'}
                  </p>
                )}

                {/* Subtotal */}
                <div className="flex h-5 items-center justify-between pt-1 font-mono">
                  <span className="text-[15px] leading-5 font-normal text-[#F5F1EB]">Subtotal</span>
                  <span className="text-[16px] leading-4 font-normal text-[#F5F1EB]">
                    {quote.data ? `${formatEth(quote.data.subtotalEth)} ETH` : '—'}
                  </span>
                </div>

                {/* Desconto do lançamento */}
                <div className="flex h-5 items-center justify-between font-mono">
                  <span className="text-[15px] leading-5 font-normal text-[#F5F1EB]">
                    Desconto do lançamento
                  </span>
                  <span className="text-[15px] leading-5 font-normal text-[#F5F1EB]">
                    {quote.data && quote.data.discountEth !== '0'
                      ? `(-) ${formatEth(quote.data.discountEth)} ETH`
                      : '(-) 00.00'}
                  </span>
                </div>

                {/* Taxa de rede */}
                <div className="flex flex-col items-end gap-0 font-mono">
                  <div className="flex h-5 w-full items-center justify-between">
                    <span className="text-[15px] leading-5 font-normal text-[#F5F1EB]">
                      Taxa de rede
                    </span>
                    <span className="text-[16px] leading-4 font-normal text-[#F5F1EB]">
                      {quote.data ? `${formatEth(quote.data.networkFeeEth)} ETH` : '—'}
                    </span>
                  </div>
                  <span className="text-[12px] leading-4 font-normal text-[#E89B55]">
                    Taxa estimada
                  </span>
                </div>

                {/* Total */}
                <div className="flex h-4 items-center justify-between font-mono">
                  <span className="text-[16px] leading-4 font-bold text-[#F5F1EB]">Total</span>
                  <span className="text-[18px] leading-4 font-bold text-[#E89B55]">
                    {quote.data ? `${formatEth(quote.data.totalEth)} ETH` : '—'}
                  </span>
                </div>

                {/* Checkout Button */}
                <div className="pt-2">
                  <Link
                    to="/pagamento"
                    aria-label="Finalizar compra"
                    className={cn(
                      'flex h-[60px] w-full cursor-pointer items-center justify-center rounded-[40px] bg-gradient-to-r from-[#D28A4C] to-[#D28A4C]/80 font-mono text-[16px] font-bold text-[#140D0A] shadow-[0px_6px_20px_rgba(10,6,4,0.45)] transition-opacity hover:opacity-95',
                      (!quote.data || items.length === 0) &&
                        'pointer-events-none cursor-not-allowed opacity-50',
                    )}
                  >
                    Conectar e finalizar
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
