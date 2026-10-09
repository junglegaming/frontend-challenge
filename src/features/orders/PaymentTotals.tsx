import { displayEth } from '@/lib/money';
export function PaymentTotals({
  value,
}: {
  value: {
    subtotal: string;
    discount: string;
    networkFee: string;
    total: string;
  };
}) {
  return (
    <dl aria-label="Resumo do pagamento" className="grid grid-cols-2">
      {(
        [
          ['Subtotal', value.subtotal],
          ['Desconto', value.discount],
          ['Taxa de rede', value.networkFee],
          ['Total', value.total],
        ] as const
      ).map(([label, amount]) => (
        <div key={label} className="contents">
          <dt>{label}</dt>
          <dd>{displayEth(amount, { maxDecimals: 4 })}</dd>
        </div>
      ))}
    </dl>
  );
}
