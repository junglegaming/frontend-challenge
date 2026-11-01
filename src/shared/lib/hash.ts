/**
 * Gera uma chave de idempotência única usando o `crypto.randomUUID` do navegador.
 * @returns um UUID v4 no formato string.
 */
export function createIdempotencyKey(): string {
  return crypto.randomUUID()
}

/**
 * Gera um id estável com prefixo opcional.
 * @param prefix prefixo opcional aplicado ao id (ex.: "nft" gera "nft_<uuid>").
 * @returns o id no formato `<prefix>_<uuid>` ou apenas `<uuid>` quando sem prefixo.
 */
export function stableId(prefix?: string): string {
  const uuid = crypto.randomUUID()
  return prefix ? `${prefix}_${uuid}` : uuid
}
