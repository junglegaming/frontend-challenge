import { Link } from '@tanstack/react-router';
import ShoppingCart from '@/assets/nft-detail/shop.svg?react';
import type { Nft } from '@/types/api';
import { QuantityStepper } from '@/components/shared/QuantityStepper';
import { Price } from '@/components/shared/Price';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import type { NftDetailController } from '../hooks/useNftDetail';

export function PurchaseControls({
  nft,
  controller,
  mobile = false,
}: {
  nft: Nft;
  controller: NftDetailController;
  mobile?: boolean;
}) {
  const unavailable = !nft.editable || controller.available < 1;
  const describedBy = !nft.editable
    ? 'purchase-unavailable'
    : nft.available === 0
      ? 'purchase-stock'
      : undefined;
  const stepper = (
    <QuantityStepper
      value={controller.quantity}
      max={controller.available}
      disabled={unavailable || controller.buying}
      onChange={(value) => void controller.onQuantity(value)}
      compact={mobile}
    />
  );
  const buy = (
    <button
      type="button"
      onClick={controller.onBuy}
      disabled={unavailable || controller.buying}
      aria-describedby={describedBy}
      className={
        mobile
          ? 'from-primary to-primary/80 text-ink h-15 w-49 rounded-full bg-linear-to-r text-base font-bold disabled:opacity-40'
          : 'bg-primary text-ink text-body-bold rounded-default h-10 w-32.5 disabled:opacity-40'
      }
    >
      {controller.buying ? 'Adicionando…' : mobile ? 'Comprar NFT' : 'COMPRAR'}
    </button>
  );
  if (mobile)
    return (
      <div
        aria-label="Comprar NFT"
        className="bg-surface-card fixed inset-x-0 bottom-0 z-20 rounded-t-[40px] px-6 pt-5 pb-[max(2.125rem,env(safe-area-inset-bottom))] shadow-[0_0_10px_#0a060473] md:hidden"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-text-secondary text-body">Qtd.</span>
            {stepper}
          </div>
          <p className="text-title font-bold">
            <Price value={nft.price} />
          </p>
        </div>
        <div className="flex gap-3">
          {buy}
          <Link
            to="/cart"
            aria-label="Ver carrinho"
            className="bg-surface-raised border-border flex size-15 items-center justify-center rounded-full border"
          >
            <ShoppingCart className="text-secondary size-5" />
          </Link>
        </div>
        {unavailable && (
          <p className="text-coral mt-2 text-xs">
            {!nft.editable
              ? 'Edição indisponível'
              : 'Sem exemplares disponíveis'}
          </p>
        )}
      </div>
    );
  return (
    <div className="hidden items-center justify-between gap-4 md:flex">
      {stepper}
      <div className="flex gap-2">
        {buy}
        <FavoriteButton
          selected={controller.selected}
          pending={controller.favoritePending}
          onClick={controller.onFavorite}
        />
      </div>
    </div>
  );
}
