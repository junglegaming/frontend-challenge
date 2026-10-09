import { Link } from '@tanstack/react-router';
import { OrderItemsList } from '@/components/shared/OrderItemsList';
import { displayEth } from '@/lib/money';
import type { Cart } from '@/types/api';

export function OrderReview({
  cart,
  coupon,
  totals,
}: {
  cart: Cart;
  coupon?: string;
  totals?: {
    subtotal: string;
    discount: string;
    networkFee: string;
    total: string;
  };
}) {
  return (
    <section aria-label="Revisão do pedido" className="grid min-w-0">
      <h2 className="text-body-17-bold mb-3">Seus NFTs</h2>
      <div className="mb-3 flex justify-between border-b-[0.3px] pb-3">
        <span className="text-body-lg-bold">NFTs</span>
        <span className="text-body-lg-medium">Subtotal</span>
      </div>
      <OrderItemsList items={cart.items} />
      <p className="text-tiny my-3 text-center">
        {coupon ? (
          `Código promocional: ${coupon}`
        ) : (
          <Link to="/cart">Tem um código promocional? Aplique aqui</Link>
        )}
      </p>
      {totals && (
        <dl className="text-body grid grid-cols-2 gap-y-3">
          <dt>Subtotal</dt>
          <dd className="text-body-18-regular justify-self-end">
            {displayEth(totals.subtotal)}
          </dd>
          <dt>Desconto do lançamento</dt>
          <dd className="justify-self-end">
            (-) {displayEth(totals.discount)}
          </dd>
          <dt>Taxa de rede</dt>
          <dd className="text-body-18-regular justify-self-end">
            {displayEth(totals.networkFee)}
          </dd>
          <dt className="text-tiny text-accent col-span-2 border-b-[0.3px] pb-3 text-center">
            Taxa estimada
          </dt>
          <dd className="hidden">Taxa de rede sujeita à confirmação</dd>
          <dt className="text-body-lg-bold pl-10.5">Total</dt>
          <dd className="text-body-18-bold text-accent justify-self-end pr-10.5">
            {displayEth(totals.total, { maxDecimals: 4 })}
          </dd>
        </dl>
      )}
    </section>
  );
}
