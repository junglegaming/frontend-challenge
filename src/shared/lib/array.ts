/**
 * Gera um array de inteiros de 0 até n - 1.
 * @param n tamanho do intervalo.
 * @returns um array `[0, 1, ..., n - 1]`.
 */
export function range(n: number): number[] {
  return Array.from({ length: n }, (_, index) => index)
}

/**
 * Remove itens duplicados de um array preservando a ordem original.
 * @param items array de origem.
 * @returns um novo array sem duplicatas.
 */
export function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}
