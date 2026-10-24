import { CoinsAdminError } from '../api/client'

/**
 * User-facing message for a coins-admin failure (specs/012-coins-admin/data-model.md, "Erros"). A known cause
 * always gets its specific message; the generic one is only for the unexpected.
 */
export function coinsAdminErrorMessage(error: unknown): string {
  if (!(error instanceof CoinsAdminError)) return 'Não foi possível concluir a operação.'

  if (error.isInvalidCredentials) return 'E-mail ou senha incorretos.'
  if (error.isSessionExpired) return 'Sua sessão de administrador expirou. Entre de novo.'
  if (error.isRetryable) return 'Serviço de moedas indisponível. Tente novamente.'
  if (error.isInvalidOwnerId) return 'Identificador de dono inválido.'
  if (error.status === 400) return error.message
  return 'Não foi possível concluir a operação.'
}
