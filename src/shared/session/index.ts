import { type Session } from '@/shared/contracts'

const TOKEN_KEY = 'kurio:token'
const VISITOR_KEY = 'kurio:visitor'

/** Id estável do visitante (gerado uma vez, persistido em localStorage). */
export function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(VISITOR_KEY, id)
  }
  return id
}

/** Token opaco da sessão autenticada (null se visitante). */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setSession(session: Session): void {
  localStorage.setItem(TOKEN_KEY, session.token)
}

/** Limpa a sessão (logout/troca de usuário). Senha nunca é persistida. */
export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Chave de propriedade dos dados: usuário autenticado ou visitante.
 * Usada para isolar cache e queries por dono (evita vazamento entre usuários).
 */
export function getOwnerKey(): string {
  const token = getToken()
  return token ? `user:${token}` : `visitor:${getVisitorId()}`
}
