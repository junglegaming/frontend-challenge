import { useRef } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { AlertCircle, Clock, X } from 'lucide-react'

import { WALLET_PROVIDER_LABELS } from '@/features/checkout/checkout-form'
import { formatTokenId } from '@/features/checkout/format'
import { orderQueryOptions } from '@/features/orders/api'
import { DEFAULT_NFT_LIST_QUERY } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'
import { formatEth, mul } from '@/shared/lib/money'
import { useFocusTrap } from '@/shared/lib/useFocusTrap'
import { getToken } from '@/shared/session'

export const Route = createFileRoute('/pedido/$orderId')({
  beforeLoad: ({ params }) => {
    if (!getToken())
      throw redirect({ to: '/login', search: { redirect: `/pedido/${params.orderId}` } })
  },
  component: OrderPage,
})

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function formatOrderDate(isoDate: string): string {
  const date = new Date(isoDate)
  const day = date.getDate().toString().padStart(2, '0')
  return `${day} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`
}

/** Encurta o hash da transação; sem hash, o pagamento ainda não foi confirmado. */
function formatTxHash(hash: string | null): string {
  if (!hash) return 'Aguardando'
  if (hash.length <= 12) return hash
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`
}

function ThankYouIcon({ className }: { className?: string }) {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Back open flap */}
      <path
        d="M16 32L40 14L64 32"
        stroke="#D28A4C"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Note card */}
      <rect
        x="22"
        y="18"
        width="36"
        height="34"
        rx="2"
        fill="#241612"
        stroke="#D28A4C"
        strokeWidth="2.5"
      />
      <text
        x="40"
        y="32"
        textAnchor="middle"
        fill="#D28A4C"
        fontSize="9"
        fontWeight="800"
        fontFamily="Roboto Mono, monospace"
        letterSpacing="0.05em"
      >
        THANK
      </text>
      <text
        x="40"
        y="43"
        textAnchor="middle"
        fill="#D28A4C"
        fontSize="9"
        fontWeight="800"
        fontFamily="Roboto Mono, monospace"
        letterSpacing="0.05em"
      >
        YOU
      </text>
      {/* Front envelope pocket */}
      <path
        d="M12 36V62C12 64 13.5 65.5 15.5 65.5H64.5C66.5 65.5 68 64 68 62V36L40 54L12 36Z"
        fill="#241612"
        stroke="#D28A4C"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Diagonal folds */}
      <path d="M12 63.5L34 46" stroke="#D28A4C" strokeWidth="2" strokeLinecap="round" />
      <path d="M68 63.5L46 46" stroke="#D28A4C" strokeWidth="2" strokeLinecap="round" />
      {/* Sparkles */}
      <path d="M10 22L15 25" stroke="#D28A4C" strokeWidth="2" strokeLinecap="round" />
      <path d="M70 22L65 25" stroke="#D28A4C" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 6V9" stroke="#D28A4C" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function OrderPage() {
  const { orderId } = Route.useParams()
  const navigate = useNavigate()
  const orderQuery = useQuery(orderQueryOptions(orderId))
  const dialogRef = useRef<HTMLDivElement>(null)
  const hasOrder = Boolean(orderQuery.data)

  // O recibo abre como diálogo: o foco fica preso nele até fechar.
  useFocusTrap(dialogRef, hasOrder)

  if (orderQuery.isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[1248px] items-center justify-center px-4 py-24 sm:px-6">
        <div className="flex flex-col items-center gap-3 font-mono text-[#F5F1EB]">
          <Clock className="size-8 animate-spin text-primary" />
          <p className="text-sm">Carregando pedido…</p>
        </div>
      </div>
    )
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="mx-auto flex w-full max-w-[1248px] flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
        <h1 className="font-mono text-2xl font-bold text-[#F5F1EB]">Pedido não encontrado</h1>
        <p className="mt-2 font-mono text-sm text-[#CFB28C]">
          Não foi possível localizar as informações deste pedido.
        </p>
        <Link
          to="/"
          search={DEFAULT_NFT_LIST_QUERY}
          className="mt-6 inline-flex rounded-[5px] bg-primary px-6 py-2.5 font-mono text-sm font-bold text-[#140D0A] transition-colors hover:bg-highlight"
        >
          Voltar ao catálogo
        </Link>
      </div>
    )
  }

  const order = orderQuery.data
  const isDeclined = order.status === 'declined'
  const isPending = order.status === 'pending'

  const displayItems = order.items.map((item) => ({
    ...item,
    totalEth: `${formatEth(mul(item.priceEth, item.quantity.toString()))} ETH`,
    tokenId: formatTokenId(item.nftId),
  }))
  const walletLabel = order.payment ? WALLET_PROVIDER_LABELS[order.payment.provider] : '—'
  const networkLabel = order.payment?.network ?? 'rede'
  const hasDiscount = order.discountEth !== '0'
  const txRefFormatted = formatTxHash(order.transactionRef)
  const orderDateFormatted = formatOrderDate(order.createdAt)
  const totalEthFormatted = `${formatEth(order.totalEth)} ETH`
  const networkFeeFormatted = `${formatEth(order.networkFeeEth)} ETH`

  return (
    <div className="relative min-h-screen w-full bg-[#140D0A]">
      {/* Background Checkout Screen (behind scrim per Figma spec) */}
      <div
        aria-hidden="true"
        className="pointer-events-none mx-auto flex w-full max-w-[1248px] select-none flex-col gap-[96px] px-4 py-6 opacity-40 blur-[1px] sm:px-6"
      >
        <div className="flex w-full flex-col gap-8">
          <nav className="flex h-4 items-center gap-2 font-mono text-[15px] font-bold text-[#F5F1EB]">
            <span>Início</span>
            <span>/</span>
            <span>Mercado</span>
            <span>/</span>
            <span>Pagamento</span>
          </nav>
          <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="flex w-full flex-1 flex-col gap-3 lg:max-w-[763px]">
              <h2 className="font-mono text-[17px] font-bold text-[#F5F1EB]">
                Perfil do colecionador
              </h2>
              <div className="grid w-full grid-cols-2 gap-6">
                <div className="h-[40px] rounded-[3px] border border-[#3F2319]" />
                <div className="h-[40px] rounded-[3px] border border-[#3F2319]" />
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 lg:w-[405px]">
              <h2 className="font-mono text-[17px] font-bold text-[#F5F1EB]">Seus NFTs</h2>
              <div className="h-[200px] rounded-[8px] bg-[#241612]" />
            </div>
          </div>
        </div>
      </div>

      {/* Scrim Overlay */}
      <div className="fixed inset-0 z-40 bg-[#140D0A]/85 backdrop-blur-[2px]" />

      {/* Order Confirmation Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
        <div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-modal-title"
          className="relative my-auto outline-none flex w-full max-w-[578px] flex-col rounded-[0px] bg-[#241612] shadow-2xl transition-all"
        >
          {/* Close Button X */}
          <button
            type="button"
            onClick={() => navigate({ to: '/', search: DEFAULT_NFT_LIST_QUERY })}
            aria-label="Fechar confirmação"
            className="absolute right-4 top-4 z-10 flex size-8 cursor-pointer items-center justify-center text-[#D28A4C] transition-colors hover:text-[#E89B55]"
          >
            <X className="size-5" />
          </button>

          {/* Modal Header */}
          <div className="flex flex-col items-center justify-center gap-4 px-6 pt-8 pb-6 text-center">
            {isDeclined ? (
              <AlertCircle className="size-16 text-[#F0805F]" />
            ) : isPending ? (
              <Clock className="size-16 animate-pulse text-[#D28A4C]" />
            ) : (
              <ThankYouIcon className="size-20" />
            )}

            <div className="flex flex-col gap-1">
              {!isDeclined && !isPending && <span className="sr-only">Compra confirmada</span>}

              <h1
                id="order-modal-title"
                aria-live="polite"
                className={cn(
                  'font-mono text-[16px] leading-4 font-bold',
                  isDeclined ? 'text-[#F0805F]' : 'text-[#CFB28C]',
                )}
              >
                {isDeclined
                  ? 'Pagamento recusado'
                  : isPending
                    ? 'Processando pagamento…'
                    : 'Seus NFTs agora estão na sua carteira'}
              </h1>
            </div>
          </div>

          {/* Rectangle 92: Amber divider line */}
          <div className="w-full border-b border-[#D28A4C]" />

          {/* Transaction Meta (4 columns with vertical dividers) */}
          <div className="flex w-full items-center justify-between px-6 py-3 font-mono sm:px-9">
            {/* Column 1: ID da transação */}
            <div className="flex flex-col items-start">
              <span className="text-[14px] leading-4 font-bold text-[#CFB28C]">
                ID da transação
              </span>
              <span
                title={order.transactionRef ?? order.id}
                className="max-w-[127px] truncate text-[15px] leading-5 font-normal text-[#CFB28C]"
              >
                {txRefFormatted}
              </span>
              <span className="sr-only">Transação: {order.transactionRef ?? order.id}</span>
            </div>

            {/* Divider 1 */}
            <div className="h-[31px] w-[1px] bg-[#D28A4C]" />

            {/* Column 2: Data */}
            <div className="flex flex-col items-start">
              <span className="text-[14px] leading-4 font-normal text-[#CFB28C]">Data</span>
              <span className="text-[15px] leading-5 font-normal text-[#CFB28C]">
                {orderDateFormatted}
              </span>
            </div>

            {/* Divider 2 */}
            <div className="h-[31px] w-[1px] bg-[#D28A4C]" />

            {/* Column 3: Total */}
            <div className="flex flex-col items-start">
              <span className="text-[14px] leading-4 font-normal text-[#CFB28C]">Total</span>
              <span className="text-[15px] leading-5 font-normal text-[#CFB28C]">
                {totalEthFormatted}
              </span>
            </div>

            {/* Divider 3 */}
            <div className="h-[31px] w-[1px] bg-[#D28A4C]" />

            {/* Column 4: Carteira */}
            <div className="flex flex-col items-start">
              <span className="text-[14px] leading-4 font-bold text-[#CFB28C]">Carteira</span>
              <span className="text-[15px] leading-5 font-normal text-[#CFB28C]">
                {walletLabel}
              </span>
            </div>
          </div>

          {/* Rectangle 93: Amber divider line */}
          <div className="w-full border-b border-[#D28A4C]" />

          {/* Transaction Details */}
          <div className="flex flex-col gap-3 px-6 pt-5 pb-8 sm:px-11">
            <h2 className="font-mono text-[15px] leading-4 font-bold text-[#F5F1EB]">
              Detalhes da transação
            </h2>

            {/* Table Header: NFTs, Edições, Subtotal */}
            <div className="flex flex-col gap-3">
              <div className="flex h-4 items-center justify-between font-mono">
                <span className="w-[180px] text-[16px] leading-4 font-bold text-[#F5F1EB]">
                  NFTs
                </span>
                <span className="text-center text-[16px] leading-4 font-bold text-[#F5F1EB]">
                  Edições
                </span>
                <span className="text-right text-[16px] leading-4 font-medium text-[#F5F1EB]">
                  Subtotal
                </span>
              </div>
              <div className="w-full border-b-[0.3px] border-[#D28A4C]" />
            </div>

            {/* Items List */}
            <div className="flex flex-col gap-3">
              {displayItems.map((item, idx) => (
                <div
                  key={`${item.nftId}-${idx}`}
                  className="flex h-[70px] w-full items-center justify-between rounded-[8px] bg-[#241612] py-0 pr-2 pl-0 font-mono"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="size-[70px] shrink-0 rounded-[8px] object-cover"
                    />
                    <div className="flex flex-col gap-1.5">
                      <span className="whitespace-nowrap text-[16px] leading-4 font-bold text-[#F5F1EB]">
                        {item.name}
                      </span>
                      <span className="whitespace-nowrap text-[14px] leading-4 font-normal text-[#B39463]">
                        ID do token: {item.tokenId}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 sm:gap-10">
                    <span className="whitespace-nowrap text-[14px] leading-4 font-normal text-[#CFB28C]">
                      (x {item.quantity})
                    </span>
                    <span className="whitespace-nowrap text-right text-[18px] leading-4 font-bold text-[#E89B55]">
                      {item.totalEth}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Breakdown */}
            <div className="flex flex-col gap-3 pt-2 font-mono">
              {hasDiscount && (
                <div className="flex w-full items-center justify-between">
                  <span className="text-[15px] leading-5 font-normal text-[#F5F1EB]">Desconto</span>
                  <span className="text-right text-[18px] leading-4 font-normal text-[#F5F1EB]">
                    (-) {formatEth(order.discountEth)} ETH
                  </span>
                </div>
              )}
              <div className="flex w-full items-center justify-between">
                <span className="text-[15px] leading-5 font-normal text-[#F5F1EB]">
                  Taxa de rede
                </span>
                <span className="text-right text-[18px] leading-4 font-normal text-[#F5F1EB]">
                  {networkFeeFormatted}
                </span>
              </div>

              <div className="flex w-full items-center justify-between">
                <span className="text-[16px] leading-4 font-bold text-[#F5F1EB]">Total</span>
                <span className="text-right text-[18px] leading-4 font-bold text-[#E89B55]">
                  {totalEthFormatted}
                </span>
              </div>

              {/* Line 13 divider */}
              <div className="w-full border-b-[0.3px] border-[#D28A4C]" />
            </div>

            {/* Footer Note & Button */}
            <div className="flex flex-col items-center gap-6 pt-2 text-center">
              <p className="max-w-[490px] font-mono text-[14px] leading-[22px] font-normal text-[#CFB28C]">
                {isDeclined
                  ? 'A transação não foi aprovada na rede. Seus itens continuam no carrinho: verifique o saldo ou use outra carteira para tentar novamente.'
                  : isPending
                    ? `Aguardando a confirmação na ${networkLabel}. Esta página atualiza sozinha; você pode recarregar sem criar outra compra.`
                    : `Transação confirmada na ${networkLabel}. A propriedade foi transferida para sua carteira conectada e registrada na rede.`}
              </p>

              {isDeclined ? (
                <Link
                  to="/pagamento"
                  className="flex h-[48px] w-[186px] cursor-pointer items-center justify-center rounded-[5px] bg-[#D28A4C] font-mono text-[16px] leading-4 font-bold text-[#140D0A] transition-colors hover:bg-[#E89B55]"
                >
                  Tentar novamente
                </Link>
              ) : (
                // Referências de transação são simuladas: o explorador não é aberto.
                <span
                  aria-disabled="true"
                  title="Explorador simulado: indisponível na demonstração"
                  className="flex h-[48px] min-w-[186px] cursor-not-allowed items-center justify-center rounded-[5px] border border-[#D28A4C] px-4 font-mono text-[14px] leading-4 font-bold text-[#E89B55] opacity-80"
                >
                  Ver no explorador (simulado)
                </span>
              )}
            </div>
          </div>

          {/* Rectangle 90: Bottom Amber Stripe */}
          <div className="h-[10px] w-full bg-[#D28A4C]" />
        </div>
      </div>
    </div>
  )
}
