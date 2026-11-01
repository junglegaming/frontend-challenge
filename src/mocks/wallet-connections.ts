import type { WalletConnection } from '@/shared/contracts'

/**
 * Conexões simuladas de carteira, mantidas só em memória: como numa extensão
 * real, recarregar a página encerra a conexão e exige reconectar.
 */
const connections = new Map<string, WalletConnection & { userId: string }>()

/**
 * Registra uma conexão ativa para a carteira do usuário.
 *
 * @returns A conexão criada.
 */
export function openWalletConnection(
  userId: string,
  connection: Omit<WalletConnection, 'connectionId'>,
): WalletConnection {
  const created: WalletConnection = { ...connection, connectionId: `conn-${crypto.randomUUID()}` }
  connections.set(created.connectionId, { ...created, userId })
  return created
}

/**
 * Conexão ativa do usuário para a carteira informada.
 *
 * @returns A conexão, ou `null` se encerrada, inexistente ou de outro usuário.
 */
export function findWalletConnection(
  userId: string,
  connectionId: string,
  walletId: string,
): WalletConnection | null {
  const connection = connections.get(connectionId)
  if (!connection || connection.userId !== userId || connection.walletId !== walletId) return null
  return connection
}

/** Encerra uma conexão do usuário (desconexão pedida pela interface). */
export function closeWalletConnection(userId: string, connectionId: string): void {
  if (connections.get(connectionId)?.userId === userId) connections.delete(connectionId)
}

/** Encerra todas as conexões (cenário `wallet_disconnected` e reset). */
export function disconnectAllWallets(): void {
  connections.clear()
}
