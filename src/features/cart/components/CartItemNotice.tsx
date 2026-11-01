import type { CartItem } from '@/shared/contracts'
import { formatEth } from '@/shared/lib/money'

/** Props de {@link CartItemNotice}. */
interface CartItemNoticeProps {
  item: CartItem
}

/**
 * Aviso de mudança num item do carrinho: preço diferente do momento da adição,
 * estoque menor que a quantidade ou edição esgotada. Os valores já vêm
 * atualizados da API; o aviso explica por que o resumo mudou.
 *
 * @param props - {@link CartItemNoticeProps}
 * @returns Texto do aviso, ou nada quando o item segue igual.
 */
export function CartItemNotice({ item }: CartItemNoticeProps) {
  let message: string | null = null
  if (item.available === 0) {
    message = 'Edição esgotada: remova o item para finalizar.'
  } else if (item.quantity > item.available) {
    message = `Estoque insuficiente: restam ${item.available}.`
  } else if (item.addedPriceEth !== item.priceEth) {
    message = `Preço atualizado (era ${formatEth(item.addedPriceEth)} ETH).`
  }

  return (
    <span role="status" className="font-mono text-[12px] leading-4 text-coral">
      {message}
    </span>
  )
}
