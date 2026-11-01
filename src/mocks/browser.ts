import { setupWorker } from 'msw/browser'

import { handlers } from './handlers'
import { realtimeHandler } from './realtime'

/**
 * Worker MSW (navegador) — ativado por configuração (VITE_ENABLE_MOCKS).
 * Intercepta REST e Socket.IO. Roda também no build de demonstração.
 */
export const worker = setupWorker(realtimeHandler, ...handlers)
