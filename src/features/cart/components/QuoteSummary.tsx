import type { Quote } from '@/types/api';
import { displayEth } from '@/lib/money';

export function QuoteSummary({ quote }: { quote: Quote }) {
  const money = (value: string) => displayEth(value, { maxDecimals: 4 });
  return (
    <dl
      className="text-body grid grid-cols-2 items-baseline space-y-3"
      aria-label="Resumo da cotação"
      aria-live="polite"
    >
      <dt>Subtotal</dt>
      <dd className="text-body-18-regular justify-self-end">
        {money(quote.subtotal)}
      </dd>
      <dt>{quote.coupon?.description ?? 'Desconto'}</dt>
      <dd className="justify-self-end">{money(quote.discount)}</dd>
      <dt>Taxa de rede</dt>
      <dd className="justify-self-end">{money(quote.networkFee)}</dd>
      <dt aria-hidden="true"></dt>
      <dd className="text-tiny text-accent justify-self-end">Taxa estimada</dd>
      <dt className="text-body-lg-bold">Total</dt>
      <dd className="text-body-18-bold text-accent mt-6 justify-self-end">
        {money(quote.total)}
      </dd>
    </dl>
  );
}
