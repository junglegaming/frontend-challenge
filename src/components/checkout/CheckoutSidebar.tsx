import { Link } from '@tanstack/react-router'
import { EthPrice } from '@/components/common/EthPrice'
import { nftImageProps } from '@/lib/images'
import type { Cart } from '@/schemas/cart'
import type { Wallet } from '@/schemas/wallet'
import { SummaryLines } from '@/components/cart/SummaryLines'
import { WalletPicker } from './WalletPicker'

interface CheckoutSidebarProps {
  cart: Cart
  wallets: Wallet[]
  selectedWalletId: string | null
  onSelectWallet: (wallet: Wallet) => void
  onDisconnectWallet?: (wallet: Wallet) => void
  walletDisabled?: boolean
  children?: React.ReactNode
}

export function CheckoutSidebar({
  cart,
  wallets,
  selectedWalletId,
  onSelectWallet,
  onDisconnectWallet,
  walletDisabled,
  children,
}: CheckoutSidebarProps) {
  return (
    <aside
      aria-label="Resumo do pagamento"
      className="flex flex-col gap-6 rounded-2xl bg-card p-4 md:rounded-none md:bg-transparent md:p-0"
    >
      <section aria-labelledby="checkout-nfts-heading">
        <h2 id="checkout-nfts-heading" className="text-base leading-4 font-bold">
          Seus NFTs
        </h2>
        <div className="mt-3 flex items-baseline justify-between border-b border-border pb-3 text-sm leading-4">
          <span>NFTs</span>
          <span>Subtotal</span>
        </div>
        <ul className="mt-3 flex flex-col gap-3">
          {cart.items.map((item) => (
            <li key={item.id} className="flex h-[70px] items-center gap-3 bg-background/30 md:bg-card">
              <img
                {...nftImageProps(item.image, '70px')}
                alt={`Arte do NFT ${item.name}`}
                loading="lazy"
                decoding="async"
                className="h-[70px] w-[70px] shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm leading-4 font-bold">{item.name}</p>
                <p className="mt-1.5 flex min-w-0 items-center gap-2 text-xs leading-4 text-subtle">
                  <span className="truncate">ID do token: {item.tokenId}</span>
                  <span className="shrink-0">(x {item.quantity})</span>
                </p>
              </div>
              <EthPrice value={item.lineTotal} className="shrink-0 text-sm text-accent-text" />
            </li>
          ))}
        </ul>
        <Link
          to="/cart"
          className="mt-4 block text-center text-sm text-accent-text underline-offset-4 hover:underline"
        >
          Tem um código promocional? Aplique aqui
        </Link>
      </section>

      <section aria-labelledby="checkout-summary-heading">
        <h2 id="checkout-summary-heading" className="sr-only">
          Resumo do pedido
        </h2>
        <SummaryLines summary={cart.summary} totalDivider />
      </section>

      <WalletPicker
        wallets={wallets}
        selectedId={selectedWalletId}
        onSelect={onSelectWallet}
        onDisconnect={onDisconnectWallet}
        disabled={walletDisabled}
      />

      {children}
    </aside>
  )
}
