import { setupWorker } from 'msw/browser'
import { installDevtools } from './devtools'
import { resumePendingOrders } from './effects'
import { handlers } from './handlers'
import { initScenario } from './scenarios'
import { socketHandler } from './socket'

export async function startMocks() {
  initScenario()
  const worker = setupWorker(...handlers, socketHandler)
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  resumePendingOrders()
  installDevtools()
}
