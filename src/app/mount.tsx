import { StrictMode } from 'react'

import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'

import { createRoot } from 'react-dom/client'

import { routeTree } from '../routeTree.gen'
import './env'
import { queryClient } from './query-client'

// Com as rotas divididas em chunks, o chunk da rota é baixado ao passar o
// mouse/focar no link, para a navegação não esperar a rede.
const router = createRouter({ routeTree, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function mount() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}
