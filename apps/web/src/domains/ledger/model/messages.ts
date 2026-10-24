import { LedgerError } from '../api/client'

/**
 * User-facing message for a coins failure (specs/011-web-coins-real-api/data-model.md, "Erro"). A known cause
 * always gets its specific message; the generic one is only for the unexpected.
 */
export function ledgerErrorMessage(error: unknown, context?: { balance?: number; required?: number }): string {
  if (!(error instanceof LedgerError)) return 'Não foi possível concluir a operação de moedas.'

  if (error.isInsufficientBalance) {
    return context?.balance !== undefined && context.required !== undefined
      ? `Saldo de moedas insuficiente: você tem ${context.balance}, esta compra custa ${context.required}.`
      : 'Saldo de moedas insuficiente.'
  }
  if (error.isKeyConflict) return 'Esta operação já foi registrada com outro valor. Recarregue a página.'
  if (error.isRetryable) return 'Serviço de moedas indisponível. Tente novamente.'
  if (error.status === 401) return 'Sua sessão de moedas expirou. Entre de novo.'
  if (error.status === 400) return error.message
  return 'Não foi possível concluir a operação de moedas.'
}
