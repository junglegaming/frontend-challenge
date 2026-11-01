/**
 * Mocks (MSW) ativados por configuração — também no build de demonstração.
 *
 * Fica fora de `env.ts` porque é lido no chunk de entrada, antes de qualquer
 * dependência: importar `env.ts` aqui puxaria o zod para o caminho crítico do
 * carregamento. A validação completa das variáveis continua em `env.ts`,
 * executada ao montar a aplicação.
 */
export const isMocksEnabled = (import.meta.env.VITE_ENABLE_MOCKS ?? 'true') === 'true'
