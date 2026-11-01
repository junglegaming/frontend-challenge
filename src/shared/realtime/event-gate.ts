/** Limite de ids memorizados: o suficiente para reenvios próximos, sem crescer sem fim. */
const MAX_SEEN_EVENT_IDS = 500

/** Filtro de eventos de tempo real por identidade e versão. */
export interface EventGate {
  /**
   * Decide se um evento deve ser aplicado.
   *
   * @param resourceKey - Recurso afetado (ex.: `nft:nft-1`).
   * @param version - Versão do recurso carregada no evento.
   * @param eventId - Identidade estável do evento.
   * @returns `false` para duplicatas e versões iguais ou anteriores à última aplicada.
   */
  accept(resourceKey: string, version: number, eventId: string): boolean
}

/**
 * Cria um filtro que tolera duplicatas e eventos fora de ordem sem regredir
 * um estado mais recente nem reaplicar efeitos.
 *
 * @returns Um {@link EventGate} isolado (um por conexão/sessão).
 * @example
 * const gate = createEventGate()
 * gate.accept('nft:nft-1', 3, 'nft:nft-1:v3') // true
 * gate.accept('nft:nft-1', 3, 'nft:nft-1:v3') // false (duplicata)
 * gate.accept('nft:nft-1', 2, 'nft:nft-1:v2') // false (antigo)
 */
export function createEventGate(): EventGate {
  const seenEventIds = new Set<string>()
  const lastVersionByResource = new Map<string, number>()

  return {
    accept(resourceKey, version, eventId) {
      if (seenEventIds.has(eventId)) return false
      if (seenEventIds.size >= MAX_SEEN_EVENT_IDS) seenEventIds.clear()
      seenEventIds.add(eventId)

      const lastVersion = lastVersionByResource.get(resourceKey)
      if (lastVersion !== undefined && version <= lastVersion) return false
      lastVersionByResource.set(resourceKey, version)
      return true
    },
  }
}
