import { isMocksEnabled } from './app/mocks-flag'
import './index.css'

async function bootstrap() {
  // Mocks antes de importar a aplicação: garante que o WebSocket já esteja
  // patcheado antes de o socket.io-client ser carregado.
  if (isMocksEnabled) {
    const { worker } = await import('./mocks/browser')
    // Em produção o log de cada requisição no console é só custo de CPU.
    await worker.start({ onUnhandledRequest: 'bypass', quiet: import.meta.env.PROD })
    const { applyUrlControls, exposeControl } = await import('./mocks/scenarios')
    applyUrlControls()
    exposeControl()
  }

  const { mount } = await import('./app/mount')
  mount()
}

void bootstrap()
