import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { createQueryClient } from '@/shared/api/query-client'
import { realtimeClient } from '@/shared/realtime/client'
import { Toaster } from '@/shared/ui/sonner'
import { createAppRouter } from './router'

export function App() {
  const [queryClient] = useState(createQueryClient)
  const [router] = useState(() => createAppRouter(queryClient))

  useEffect(() => {
    realtimeClient.connect()
    return () => realtimeClient.disconnect()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors closeButton />
    </QueryClientProvider>
  )
}
