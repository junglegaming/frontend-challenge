import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { EthPrice } from '@/components/common/EthPrice'
import { Button } from '@/components/ui/button'
import { nftImageProps } from '@/lib/images'
import { formatEth } from '@/lib/eth'
import { NETWORK_LABELS } from '@/schemas/common'
import type { Receipt } from '@/schemas/order'

interface OrderReceiptProps {
  orderId: string
  receipt: Receipt
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const metaCell = 'min-w-0'
const metaDivider =
  'min-w-0 md:relative md:pl-[18px] md:before:absolute md:before:top-1/2 md:before:left-0 md:before:h-[31px] md:before:w-px md:before:-translate-y-1/2 md:before:bg-primary'

function shortHash(hash: string) {
  return hash.length > 12 ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : hash
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`
}

function ThankYouEnvelope() {
  return (
    <svg viewBox="0 0 80 80" className="size-20 text-primary" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M14 22.5h52v44H14z" strokeWidth="1.4" />
      <path d="M6 31.5 14 25M74 31.5 66 25" strokeWidth="1.4" />
      <path d="M14 24.5 40 46l26-21.5" strokeWidth="1.4" />
      <path d="M14 65.5 33 47M66 65.5 47 47" strokeWidth="1.4" />
      <text x="40" y="28" textAnchor="middle" fill="currentColor" stroke="none" fontSize="9" fontWeight="700" letterSpacing="0.2">
        THANK
      </text>
      <text x="40" y="39" textAnchor="middle" fill="currentColor" stroke="none" fontSize="9" fontWeight="700" letterSpacing="0.2">
        YOU
      </text>
    </svg>
  )
}

export function OrderReceipt({ orderId, receipt }: OrderReceiptProps) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="flex min-h-full items-center justify-center p-4 md:p-8">
        <section
          aria-labelledby="order-receipt-heading"
          className="relative my-auto w-full max-w-[578px] bg-card"
        >
          <Link
            to="/cart"
            aria-label="Fechar confirmação e voltar ao carrinho"
            className="absolute top-2 right-2 z-10 grid size-9 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-background/40 hover:text-foreground"
          >
            <X className="size-[18px]" aria-hidden="true" />
          </Link>

          <div className="flex flex-col items-center border-b border-primary px-6 pt-[22px] pb-[22px] text-center">
            <ThankYouEnvelope />
            <h1 id="order-receipt-heading" className="mt-4 text-base leading-4 font-medium text-muted-foreground">
              Seus NFTs agora estão na sua carteira
            </h1>
            <p className="sr-only">Pedido {orderId}</p>
          </div>

          <dl className="grid grid-cols-2 gap-y-3 border-b border-primary px-6 py-[14px] md:grid-cols-[145px_144px_126px_91px] md:gap-y-0 md:px-9">
            <div className={metaCell}>
              <dt className="text-sm leading-4 whitespace-nowrap text-muted-foreground">ID da transação</dt>
              <dd className="mt-0 text-base leading-5 whitespace-nowrap text-muted-foreground">
                {shortHash(receipt.txHash)}
                <span className="sr-only"> (hash completo: {receipt.txHash})</span>
              </dd>
            </div>
            <div className={metaDivider}>
              <dt className="text-sm leading-4 whitespace-nowrap text-muted-foreground">Data</dt>
              <dd className="mt-0 text-base leading-5 whitespace-nowrap text-muted-foreground">{formatDate(receipt.createdAt)}</dd>
            </div>
            <div className={metaDivider}>
              <dt className="text-sm leading-4 whitespace-nowrap text-muted-foreground">Total</dt>
              <dd className="mt-0 text-base leading-5 whitespace-nowrap text-muted-foreground">{formatEth(receipt.total)}</dd>
            </div>
            <div className={metaDivider}>
              <dt className="text-sm leading-4 whitespace-nowrap text-muted-foreground">Carteira</dt>
              <dd className="mt-0 text-base leading-5 whitespace-nowrap text-muted-foreground">{receipt.walletLabel}</dd>
            </div>
          </dl>

          <div className="px-6 pt-5 pb-12 md:px-11">
            <h2 className="text-sm leading-4 font-bold">Detalhes da transação</h2>

            <div className="mt-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-border-soft pb-3 text-base leading-4 font-bold md:grid-cols-[minmax(0,1fr)_116px_77px] md:gap-x-0">
                <span>NFTs</span>
                <span className="hidden md:block">Edições</span>
                <span>Subtotal</span>
              </div>

              <ul className="mt-3 flex flex-col gap-3">
                {receipt.items.map((item) => (
                  <li
                    key={`${item.nftId}-${item.editionId}`}
                    className="grid min-h-[70px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 md:grid-cols-[minmax(0,1fr)_116px_90px] md:gap-x-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        {...nftImageProps(item.image, '70px')}
                        alt={`Arte do NFT ${item.name}`}
                        loading="lazy"
                        decoding="async"
                        className="size-14 shrink-0 rounded object-cover md:size-[70px]"
                      />
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm leading-4 font-bold md:truncate md:text-base">{item.name}</p>
                        <p className="mt-1.5 text-xs leading-4 text-subtle md:text-sm">ID do token: {item.tokenId}</p>
                        <p className="mt-1 text-xs text-muted-foreground md:hidden">Quantidade: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="hidden text-sm text-muted-foreground md:block">(x {item.quantity})</span>
                    <EthPrice value={item.lineTotal} className="text-base text-accent-text" />
                  </li>
                ))}
              </ul>
            </div>

            <dl className="mt-3 ml-auto flex w-full max-w-[321px] flex-col gap-3">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-base">Taxa de rede</dt>
                <dd className="text-base tabular-nums">{formatEth(receipt.networkFee)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-base font-bold">Total</dt>
                <dd>
                  <EthPrice value={receipt.total} className="text-base text-accent-text" />
                </dd>
              </div>
            </dl>

            {receipt.couponCode && (
              <p className="sr-only">
                Cupom aplicado: <span>{receipt.couponCode}</span>
              </p>
            )}

            <div className="mt-3 border-t border-border-soft" />

            <div className="mt-3 text-center">
              <p className="mx-auto max-w-[490px] text-sm leading-[22px] text-accent-text">
                Transação confirmada na {NETWORK_LABELS[receipt.network]}. A propriedade foi transferida para sua carteira
                conectada e registrada na rede.
              </p>

              <div className="mt-5 flex justify-center">
                <Button asChild className="h-12 rounded-sm px-4 text-base">
                  <a href={receipt.explorerUrl} target="_blank" rel="noopener noreferrer">
                    Ver no Etherscan
                    <span className="sr-only"> (simulado)</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div className="h-2.5 w-full bg-primary" aria-hidden="true" />
        </section>
      </div>
    </div>
  )
}
