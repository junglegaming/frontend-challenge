import '@/shared/config/zod' // must stay first: see the comment in that file
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { env } from '@/shared/config/env'
import '@fontsource/space-mono/400.css'
import '@fontsource/space-mono/700.css'
import './index.css'

async function enableMocking() {
  if (!env.enableMocks) return
  const [{ worker }, { installMockDevtools }] = await Promise.all([
    import('@/mocks/browser'),
    import('@/mocks/devtools'),
  ])
  installMockDevtools()
  await worker.start({ onUnhandledRequest: 'bypass', quiet: import.meta.env.PROD })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
